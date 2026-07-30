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

// ============================================
// IMAGE ROTATION
// ============================================

/**
 * Rotate an image File by 90° (clockwise or counter-clockwise).
 * Returns a new File with the rotated image.
 * Also applies client-side resize if the result would be too large for upload.
 *
 * @param file     The image File to rotate
 * @param degrees  90 (clockwise) or -90 (counter-clockwise). Other values
 *                 will be normalized to the nearest 90° increment.
 */
export async function rotateImage(file: File, degrees: 90 | -90): Promise<File> {
  // SVG cannot be rotated as a raster image — return as-is
  if (file.type === 'image/svg+xml') {
    console.warn('[rotateImage] SVG cannot be rotated as raster, returning original')
    return file
  }

  try {
    const img = await loadImage(file)
    const originalW = img.naturalWidth
    const originalH = img.naturalHeight

    // After 90° rotation, width and height swap
    const canvas = document.createElement('canvas')
    canvas.width = originalH
    canvas.height = originalW
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.warn('[rotateImage] Could not get canvas context, returning original')
      return file
    }

    // Translate to center, rotate, translate back, then draw
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((degrees * Math.PI) / 180)
    ctx.drawImage(img, -originalW / 2, -originalH / 2)

    // Determine output format (preserve PNG for transparency, JPEG otherwise)
    const isPngWithTransparency = file.type === 'image/png'
    const outputType = isPngWithTransparency ? 'image/png' : 'image/jpeg'
    const quality = isPngWithTransparency ? undefined : JPEG_QUALITY

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, quality)
    })

    if (!blob) {
      console.warn('[rotateImage] canvas.toBlob returned null, returning original')
      return file
    }

    // Build new filename with rotated suffix
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    const newExt = outputType === 'image/png' ? 'png' : 'jpg'
    const newName = `${baseName}-rot${degrees > 0 ? 'cw' : 'ccw'}.${newExt}`

    let rotatedFile = new File([blob], newName, {
      type: outputType,
      lastModified: Date.now(),
    })

    console.log(
      `[rotateImage] ${file.name} ${degrees}°: ` +
      `${originalW}x${originalH} → ${rotatedFile.size / 1024 / 1024}MB`
    )

    // If the rotated file is still too large for upload, resize it
    if (rotatedFile.size > MAX_UPLOAD_BYTES) {
      console.log('[rotateImage] Result too large, applying resize...')
      rotatedFile = await resizeImageForUpload(rotatedFile)
    }

    return rotatedFile
  } catch (err) {
    console.error('[rotateImage] Error rotating, returning original:', err)
    return file
  }
}

// Maximum upload payload size (must match /api/upload MAX_SIZE = 4MB)
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
