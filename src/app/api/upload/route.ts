import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const ALLOWED_CATEGORIES = ['planos', 'renders', 'galeria', 'general', 'logos']
const DEFAULT_CATEGORY = 'general'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = formData.get('category') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate category
    const safeCategory = category && ALLOWED_CATEGORIES.includes(category) ? category : DEFAULT_CATEGORY

    // Sanitize filename
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const ext = path.extname(originalName).toLowerCase()
    const baseName = path.basename(originalName, ext).replace(/\s+/g, '-').toLowerCase()
    const timestamp = Date.now()
    const fileName = `${baseName}-${timestamp}${ext}`

    const publicDir = path.join(process.cwd(), 'public', 'images', safeCategory)
    await mkdir(publicDir, { recursive: true })

    const filePath = path.join(publicDir, fileName)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const publicUrl = `/images/${safeCategory}/${fileName}`
    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
