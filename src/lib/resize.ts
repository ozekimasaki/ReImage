let picaInstance: any = null

async function getPica() {
  if (!picaInstance) {
    const picaModule = await import('pica')
    const PicaClass = picaModule.default || (picaModule as any).Pica
    picaInstance = new PicaClass()
  }
  return picaInstance
}

type CanvasLike = OffscreenCanvas | HTMLCanvasElement

export interface ResizeResult {
  canvas: CanvasLike
  width: number
  height: number
}

export async function resizeImage(
  imageBitmap: ImageBitmap,
  maxDimension: number
): Promise<ResizeResult> {
  const { width, height } = imageBitmap

  // リサイズ不要な場合
  const createCanvas = (w: number, h: number): CanvasLike => {
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(w, h)
    }
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    return c
  }

  if (width <= maxDimension && height <= maxDimension) {
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas context not available')
    }
    ctx.drawImage(imageBitmap, 0, 0)
    return { canvas, width, height }
  }

  // アスペクト比を維持してリサイズ
  let newWidth = width
  let newHeight = height

  if (width > height) {
    if (width > maxDimension) {
      newWidth = maxDimension
      newHeight = Math.round((height * maxDimension) / width)
    }
  } else {
    if (height > maxDimension) {
      newHeight = maxDimension
      newWidth = Math.round((width * maxDimension) / height)
    }
  }

  const canvas = createCanvas(newWidth, newHeight)

  // Picaを使用して高品質リサイズ
  const pica = await getPica()
  await pica.resize(imageBitmap, canvas, {
    quality: 3,
    unsharpAmount: 160,
    unsharpRadius: 0.6,
    unsharpThreshold: 4,
  })

  return { canvas, width: newWidth, height: newHeight }
}

