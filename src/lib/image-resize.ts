// ============================================
// Client-side image resizing before upload
// ============================================
// Vercel serverless functions have a 4.5MB body size limit. To avoid HTTP 413
// errors when uploading large images (e.g. high-res floor plans from DWG exports),
// we resize them in the browser before sending to /api/upload.
//
// Strategy:
//   1. If file is SVG → skip (vector, no resize needed)
//   2. If file is < 3.5MB → skip (already small enough)
//   3. Otherwise: load into canvas, downscale to max 2400px on longest side,
//      re-encode as JPEG quality 85, return new File.
//
// This keeps the upload payload under 4MB while preserving enough quality
// for floor plans and renders.

const MAX_DIMENSION = 2400 // px on longest side
const JPEG_QUALITY = 0.85
const SKIP_THRESHOLD = 3.5 * 1024 * 1024 // 3.5MB — skip resize if smaller

/**
 * Resize an image File in the browser before uploading.
 * Returns the original file if no resize is needed (SVG, small image, or error).
 */
export async function resizeImageForUpload(
  file: File,
  maxDimension: number = MAX_DIMENSION
): Promise<File> {
  // SVG is vector — no resize needed
  if (file.type === 'image/svg+xml') {
    return file
  }

  // Small enough — no resize needed
  if (file.size <= SKIP_THRESHOLD) {
    return file
  }

  try {
    // Load image into an HTMLImageElement
    const img = await loadImage(file)
    const originalW = img.naturalWidth
    const originalH = img.naturalHeight

    // Calculate new dimensions (preserve aspect ratio)
    let newW = originalW
    let newH = originalH
    if (originalW > maxDimension || originalH > maxDimension) {
      if (originalW >= originalH) {
        newW = maxDimension
        newH = Math.round((originalH / originalW) * maxDimension)
      } else {
        newH = maxDimension
        newW = Math.round((originalW / originalH) * maxDimension)
      }
    }

    // Draw to canvas
    const canvas = document.createElement('canvas')
    canvas.width = newW
    canvas.height = newH
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.warn('[resizeImage] Could not get canvas context, returning original')
      return file
    }
    ctx.drawImage(img, 0, 0, newW, newH)

    // Convert to blob (JPEG for photos, PNG for transparency)
    const isPngWithTransparency = file.type === 'image/png'
    const outputType = isPngWithTransparency ? 'image/png' : 'image/jpeg'
    const quality = isPngWithTransparency ? undefined : JPEG_QUALITY

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, quality)
    })

    if (!blob) {
      console.warn('[resizeImage] canvas.toBlob returned null, returning original')
      return file
    }

    // Build new File with same name but updated extension if needed
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    const newExt = outputType === 'image/png' ? 'png' : 'jpg'
    const newName = ext === newExt ? file.name : `${baseName}.${newExt}`

    const resizedFile = new File([blob], newName, {
      type: outputType,
      lastModified: Date.now(),
    })

    console.log(
      `[resizeImage] ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB ` +
      `${originalW}x${originalH} → ${newW}x${newH} ` +
      `${(resizedFile.size / 1024 / 1024).toFixed(2)}MB`
    )

    return resizedFile
  } catch (err) {
    console.error('[resizeImage] Error resizing, returning original:', err)
    return file
  }
}

/**
 * Load a File into an HTMLImageElement.
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}
