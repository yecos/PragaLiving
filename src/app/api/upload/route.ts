import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { requireAdminWithCsrf } from '@/lib/auth-guard'
import { randomUUID } from 'crypto'

// ============================================
// POST /api/upload — admin-only image upload
// ============================================
// Saves uploaded images to public/images/<category>/
// Returns the public URL path that can be stored in DB or config.
//
// On Vercel, the filesystem is read-only EXCEPT for /tmp.
// However, images in /tmp are NOT served publicly and disappear after
// the request. For production, set UPSTASH_S3_BUCKET (or similar) and
// update this route to use S3/Supabase Storage instead.
//
// For now, this implementation works in dev (local filesystem) and
// returns a placeholder URL in production so the UI doesn't break.
// In production, you should:
//   1. Create a Supabase Storage bucket "praga-media" (public)
//   2. Set SUPABASE_SERVICE_ROLE_KEY env var (already set)
//   3. Uncomment the Supabase Storage section below

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
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
        { error: `Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo: 5MB` },
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

        const { error: uploadError } = await supabase
          .storage
          .from(bucketName)
          .upload(storagePath, Buffer.from(arrayBuffer), {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) {
          console.error('[upload] Supabase Storage error:', uploadError.message)
          return NextResponse.json(
            { error: `Error al subir a Storage: ${uploadError.message}. ¿Existe el bucket '${bucketName}'?` },
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
        return NextResponse.json(
          { error: 'Error al configurar almacenamiento. Verifica SUPABASE_SERVICE_ROLE_KEY.' },
          { status: 500 }
        )
      }
    }

    // FALLBACK: return informative error
    return NextResponse.json({
      error: 'Almacenamiento no configurado en producción. Opciones: (1) configura Supabase Storage bucket "praga-media" + SUPABASE_SERVICE_ROLE_KEY, o (2) developa en local para usar filesystem.',
      hint: 'En local con `bun run dev` funciona automáticamente.',
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
