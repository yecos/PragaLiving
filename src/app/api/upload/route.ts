import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('category') as string) || 'floor-plans'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed. Use JPEG, PNG, WebP, GIF, or SVG.` },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Try uploading to Supabase Storage
    if (isSupabaseConfigured() && supabase) {
      // Ensure the bucket exists
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketName = 'uploads'
      const bucketExists = buckets?.some(b => b.name === bucketName)

      if (!bucketExists) {
        // Try to create the bucket
        await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: maxSize,
          allowedMimeTypes: allowedTypes,
        })
      }

      // Generate a unique file path
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${category}/${timestamp}-${sanitizedName}`

      // Convert File to ArrayBuffer then to Uint8Array
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, uint8Array, {
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) {
        console.error('Supabase Storage upload error:', uploadError)
        // Fall through to return a data URL as fallback
      } else {
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath)

        if (urlData?.publicUrl) {
          return NextResponse.json({
            url: urlData.publicUrl,
            path: filePath,
            storage: 'supabase',
          })
        }
      }
    }

    // Fallback: Convert to base64 data URL (for environments without Supabase Storage)
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({
      url: dataUrl,
      storage: 'base64',
      warning: 'Image stored as base64 data URL. Configure Supabase Storage for production use.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error uploading file'
    console.error('Upload error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
