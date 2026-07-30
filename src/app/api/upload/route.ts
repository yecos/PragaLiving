// ============================================
// POST /api/upload — admin-only image upload
// ============================================
// ARCHITECTURE: All app data lives in Neon Postgres via Prisma.
// Supabase is used ONLY for object storage (images) — Neon doesn't have
// blob storage. This is the only Supabase dependency in the codebase.
//
// Strategy:
//   1. Local dev: write to public/images/<category>/ (filesystem)
//   2. Production: try Supabase Storage (auto-creates bucket if missing)
//   3. Fallback: base64 data URL for images < 500KB (no storage needed)
//
// To fully remove Supabase, replace this with Vercel Blob, Cloudinary, or S3.
// See docs/SECURITY_REMEDIATION.md for migration notes.

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { requireAdminWithCsrf } from '@/lib/auth-guard'
import { randomUUID } from 'crypto'

// Vercel serverless functions have a 4.5MB body size limit on Hobby plan.
// We set MAX_SIZE to 4MB to leave room for FormData overhead and metadata.
// Larger images should be resized client-side before upload (see helpers
// in FloorPlanEditor.tsx, AdminPanel.tsx, SiteConfigEditor.tsx).
const MAX_SIZE = 4 * 1024 * 1024 // 4MB (Vercel limit is 4.5MB)
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
const CATEGORIES = ['renders', 'planos', 'galeria', 'general', 'logos', 'floor-plans']

export async function POST(req: NextRequest) {
  const auth = await requireAdminWithCsrf(req)
  if (!auth.authorized) return auth.error!

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('category') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate category
    const safeCategory = CATEGORIES.includes(category) ? category : 'general'

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${file.type}. Permitidos: JPG, PNG, WebP, SVG, GIF` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo: 4MB. La imagen será redimensionada automáticamente al subirla desde el editor.` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext) ? ext : 'jpg'
    const filename = `${Date.now()}-${randomUUID().substring(0, 8)}.${safeExt}`
    const publicPath = `/images/${safeCategory}/${filename}`

    // ── STORAGE STRATEGY ──
    // In development (local): write to public/images/<category>/
    // In production (Vercel): filesystem is read-only, so we use one of:
    //   (a) Supabase Storage (recommended) — see commented code below
    //   (b) Return the file as base64 data URL (works for small images only)
    //   (c) Return an error asking the user to configure storage

    if (process.env.NODE_ENV !== 'production') {
      // LOCAL DEV: write to filesystem
      try {
        const publicDir = path.join(process.cwd(), 'public', 'images', safeCategory)
        await mkdir(publicDir, { recursive: true })
        const filePath = path.join(publicDir, filename)
        const arrayBuffer = await file.arrayBuffer()
        await writeFile(filePath, Buffer.from(arrayBuffer))
        console.log(`[upload] Saved to ${filePath}`)
        return NextResponse.json({ success: true, url: publicPath })
      } catch (fsErr) {
        console.error('[upload] Filesystem write failed:', fsErr)
        return NextResponse.json({ error: 'No se pudo guardar el archivo' }, { status: 500 })
      }
    }

    // PRODUCTION: try Supabase Storage if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey)
        const bucketName = 'praga-media'
        const storagePath = `${safeCategory}/${filename}`
        const arrayBuffer = await file.arrayBuffer()

        // Try to get bucket info; if it doesn't exist, create it (public)
        const { error: getBucketError } = await supabase.storage.getBucket(bucketName)
        if (getBucketError && getBucketError.message.includes('not found')) {
          console.log(`[upload] Bucket '${bucketName}' not found, creating it...`)
          const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: '5MB',
            allowedMimeTypes: ALLOWED_TYPES,
          })
          if (createBucketError) {
            console.error('[upload] Could not create bucket:', createBucketError.message)
            // Fall through to base64 fallback below
          } else {
            console.log(`[upload] Bucket '${bucketName}' created successfully`)
          }
        }

        // Attempt the upload
        const { error: uploadError } = await supabase
          .storage
          .from(bucketName)
          .upload(storagePath, Buffer.from(arrayBuffer), {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) {
          console.error('[upload] Supabase Storage upload error:', uploadError.message)
          // FALLBACK: return as base64 data URL (works for images < 5MB, no storage needed)
          // This allows the admin to upload images even if Storage isn't fully configured.
          // The data URL is stored directly in site_config/floor_plans.
          if (file.size < 500_000) { // 500KB limit for base64 fallback
            const base64 = Buffer.from(arrayBuffer).toString('base64')
            const dataUrl = `data:${file.type};base64,${base64}`
            console.log(`[upload] Fallback: returning base64 data URL (${file.size} bytes)`)
            return NextResponse.json({ success: true, url: dataUrl, fallback: 'base64' })
          }
          return NextResponse.json(
            { error: `Error al subir a Storage: ${uploadError.message}. Bucket '${bucketName}' debe existir y ser público.` },
            { status: 500 }
          )
        }

        // Get public URL
        const { data: publicUrlData } = supabase
          .storage
          .from(bucketName)
          .getPublicUrl(storagePath)

        console.log(`[upload] Saved to Supabase Storage: ${publicUrlData.publicUrl}`)
        return NextResponse.json({ success: true, url: publicUrlData.publicUrl })
      } catch (storageErr) {
        console.error('[upload] Supabase Storage exception:', storageErr)
        // FALLBACK: base64 data URL for small images
        if (file.size < 500_000) {
          const arrayBuffer = await file.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          const dataUrl = `data:${file.type};base64,${base64}`
          console.log(`[upload] Exception fallback: returning base64 data URL`)
          return NextResponse.json({ success: true, url: dataUrl, fallback: 'base64' })
        }
        return NextResponse.json(
          { error: 'Error al configurar almacenamiento. Verifica SUPABASE_SERVICE_ROLE_KEY y que el bucket "praga-media" exista.' },
          { status: 500 }
        )
      }
    }

    // FALLBACK: no Supabase configured — use base64 data URL (small images only)
    if (file.size < 500_000) {
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`
      console.log(`[upload] No Supabase configured, returning base64 data URL (${file.size} bytes)`)
      return NextResponse.json({ success: true, url: dataUrl, fallback: 'base64' })
    }

    return NextResponse.json({
      error: 'Almacenamiento no configurado. Para imágenes > 500KB necesitas Supabase Storage (configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY).',
      hint: 'En local con `bun run dev` funciona automáticamente con filesystem.',
    }, { status: 501 })
  } catch (err) {
    console.error('[upload] Unexpected error:', err)
    return NextResponse.json({ error: 'Error al procesar la subida' }, { status: 500 })
  }
}

// GET — list files in a category (used by SiteConfigEditor)
export async function GET(req: NextRequest) {
  const auth = await requireAdminWithCsrf(req)
  if (!auth.authorized) return auth.error!

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || 'general'

    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 })
    }

    // In production without Supabase, we can't list files (no filesystem)
    if (process.env.NODE_ENV === 'production') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey)
        const { data, error } = await supabase.storage.from('praga-media').list(category, { limit: 100 })
        if (error) {
          return NextResponse.json({ files: [] })
        }
        const files = (data || []).map(f => ({
          name: f.name,
          url: `${supabaseUrl}/storage/v1/object/public/praga-media/${category}/${f.name}`,
        }))
        return NextResponse.json({ files })
      }
      return NextResponse.json({ files: [] })
    }

    // Local dev: list filesystem
    try {
      const { readdir } = await import('fs/promises')
      const dir = path.join(process.cwd(), 'public', 'images', category)
      const files = await readdir(dir)
      return NextResponse.json({
        files: files
          .filter(f => /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f))
          .map(f => ({ name: f, url: `/images/${category}/${f}` })),
      })
    } catch {
      return NextResponse.json({ files: [] })
    }
  } catch (err) {
    console.error('[upload] GET error:', err)
    return NextResponse.json({ files: [] })
  }
}
