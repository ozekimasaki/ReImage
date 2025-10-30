export async function loadImageWithOrientation(
  file: File
): Promise<{
  imageBitmap: ImageBitmap
  width: number
  height: number
}> {
  const arrayBuffer = await file.arrayBuffer()
  const blob = new Blob([arrayBuffer], { type: file.type })

  const imageBitmap = await createImageBitmap(blob, {
    imageOrientation: 'from-image',
    premultiplyAlpha: 'none',
  })

  return {
    imageBitmap,
    width: imageBitmap.width,
    height: imageBitmap.height,
  }
}

export function createPreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

export function calculateReductionRate(
  originalSize: number,
  newSize: number
): number {
  if (originalSize === 0) return 0
  return Math.round(((originalSize - newSize) / originalSize) * 100)
}

