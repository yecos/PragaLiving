import { NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import path from 'path'

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images')

export async function GET() {
  try {
    const categories = ['renders', 'planos', 'galeria', 'general', 'logos']
    const result: Record<string, Array<{ name: string; url: string; size: number }>> = {}

    for (const cat of categories) {
      const dir = path.join(IMAGES_DIR, cat)
      try {
        const files = await readdir(dir)
        result[cat] = []
        for (const file of files) {
          const filePath = path.join(dir, file)
          const fileStat = await stat(filePath)
          if (fileStat.isFile() && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)) {
            result[cat].push({
              name: file,
              url: `/images/${cat}/${file}`,
              size: fileStat.size,
            })
          }
        }
      } catch {
        result[cat] = []
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read media' }, { status: 500 })
  }
}
