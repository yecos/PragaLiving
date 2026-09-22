import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import path from 'path'
import { requireAdmin } from '@/lib/auth-guard'

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images')
const CATEGORIES = ['renders', 'planos', 'galeria', 'general', 'logos', 'floor-plans']

type MediaItem = { name: string; url: string; size: number }

async function listBundledFiles(category: string): Promise<MediaItem[]> {
  const dir = path.join(IMAGES_DIR, category)
  try {
    const files = await readdir(dir)
    const items: MediaItem[] = []
    for (const file of files) {
      const filePath = path.join(dir, file)
      const fileStat = await stat(filePath)
      if (fileStat.isFile() && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)) {
        items.push({
          name: file,
          url: `/images/${category}/${file}`,
          size: fileStat.size,
        })
      }
    }
    return items
  } catch {
    return []
  }
}

async function listUploadedFiles(category: string): Promise<MediaItem[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return []

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase.storage.from('praga-media').list(category, {
      limit: 200,
      sortBy: { column: 'created_at', order: 'desc' },
    })
    if (error) {
      console.error('[media] Supabase list failed:', error.message)
      return []
    }

    return (data || [])
      .filter((file) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name))
      .map((file) => ({
        name: file.name,
        url: `${supabaseUrl}/storage/v1/object/public/praga-media/${category}/${file.name}`,
        size: Number(file.metadata?.size || 0),
      }))
  } catch (error) {
    console.error('[media] Supabase list exception:', error)
    return []
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.authorized) return auth.error!

  try {
    const result: Record<string, MediaItem[]> = {}

    await Promise.all(CATEGORIES.map(async (category) => {
      const [bundled, uploaded] = await Promise.all([
        listBundledFiles(category),
        listUploadedFiles(category),
      ])

      const merged = new Map<string, MediaItem>()
      for (const item of [...uploaded, ...bundled]) {
        merged.set(item.url, item)
      }
      result[category] = Array.from(merged.values())
    }))

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    console.error('[media] GET error:', error)
    return NextResponse.json({ error: 'Failed to read media' }, { status: 500 })
  }
}
