import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Sanitize filename
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const ext = path.extname(originalName).toLowerCase()
    const baseName = path.basename(originalName, ext).replace(/\s+/g, '-').toLowerCase()
    const timestamp = Date.now()
    const fileName = `${baseName}-${timestamp}${ext}`

    const publicDir = path.join(process.cwd(), 'public', 'images', 'planos')
    await mkdir(publicDir, { recursive: true })

    const filePath = path.join(publicDir, fileName)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const publicUrl = `/images/planos/${fileName}`
    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
