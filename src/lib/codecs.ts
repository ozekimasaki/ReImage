import type { OutputFormat, CodecOptions } from '../types'

// AVIFエンコードモジュールの遅延読み込み（動的インポート）
// WASMファイルが大きいため、必要な時だけ読み込む
let encodeAVIFModule: any = null
let isAVIFLoading = false
let avifLoadPromise: Promise<any> | null = null

async function loadAVIFEncoder(): Promise<any> {
  if (encodeAVIFModule) {
    return encodeAVIFModule
  }
  
  if (isAVIFLoading && avifLoadPromise) {
    return avifLoadPromise
  }
  
  isAVIFLoading = true
  avifLoadPromise = import('@jsquash/avif/encode').then((module) => {
    encodeAVIFModule = module.default || module
    isAVIFLoading = false
    return encodeAVIFModule
  }).catch((error) => {
    isAVIFLoading = false
    avifLoadPromise = null
    throw error
  })
  
  return avifLoadPromise
}

// ブラウザがAVIFエンコードをサポートしているかチェック
async function isAVIFSupported(): Promise<boolean> {
  if (typeof OffscreenCanvas === 'undefined') {
    return false
  }
  
  try {
    const canvas = new OffscreenCanvas(1, 1)
    const blob = await canvas.convertToBlob({ type: 'image/avif' })
    return blob.type === 'image/avif'
  } catch {
    return false
  }
}

// ブラウザ側でAVIFエンコードを実行
async function encodeAVIFInBrowser(
  imageData: ImageData,
  options: CodecOptions
): Promise<ArrayBuffer> {
  try {
    // ImageDataの検証
    if (!imageData || !imageData.data || imageData.data.length === 0) {
      throw new Error('無効な画像データです')
    }

    if (imageData.width <= 0 || imageData.height <= 0) {
      throw new Error('画像サイズが無効です')
    }

    // メモリ使用量の検証（大きすぎる画像の場合）
    const pixelCount = imageData.width * imageData.height
    const maxPixels = 100_000_000 // 1億ピクセル（約10000x10000）
    if (pixelCount > maxPixels) {
      throw new Error(`画像が大きすぎます（${imageData.width}×${imageData.height}px）。サイズを縮小してください。`)
    }

    // 品質設定: 0-100を0-1の範囲に変換（Canvas API用）
    const quality = options.quality !== undefined 
      ? Math.max(0, Math.min(100, options.quality)) / 100
      : 0.8

    // まずCanvas APIでAVIFエンコードを試行（ネイティブ、軽量、高速）
    if (await isAVIFSupported()) {
      try {
        const canvas = new OffscreenCanvas(imageData.width, imageData.height)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Canvas context not available')
        }

        ctx.putImageData(imageData, 0, 0)

        const blob = await canvas.convertToBlob({
          type: 'image/avif',
          quality: quality,
        })

        if (blob.type === 'image/avif') {
          return blob.arrayBuffer()
        }
      } catch (canvasError) {
        // Canvas APIでのエンコードに失敗した場合はWASMにフォールバック
        console.warn('Canvas APIでのAVIFエンコードに失敗、WASMにフォールバック:', canvasError)
      }
    }

    // Canvas APIがサポートされていない、または失敗した場合はWASMライブラリを使用
    const speed = options.speed !== undefined 
      ? options.speed 
      : pixelCount > 10_000_000 ? 10 : 8

    const encodeAVIF = await loadAVIFEncoder()
    
    const encodeAVIFFn = typeof encodeAVIF === 'function' 
      ? encodeAVIF 
      : (encodeAVIF as any).default || encodeAVIF

    if (typeof encodeAVIFFn !== 'function') {
      throw new Error('@jsquash/avif/encodeが正しく読み込まれていません')
    }

    // WASMライブラリでAVIFエンコードを実行
    const encoded = await encodeAVIFFn(imageData, {
      quality: options.quality !== undefined ? Math.max(0, Math.min(100, options.quality)) : 80,
      speed,
    })

    if (!encoded) {
      throw new Error('AVIFエンコード結果が空です')
    }

    // ArrayBufferまたはUint8ArrayをArrayBufferに変換
    if (encoded instanceof ArrayBuffer) {
      return encoded
    } else if (encoded instanceof Uint8Array) {
      const copy = new Uint8Array(encoded)
      return copy.buffer as ArrayBuffer
    } else {
      throw new Error('予期しないエンコード結果の形式です')
    }
  } catch (error) {
    let errorMessage = 'AVIFエンコードに失敗しました'
    
    if (error instanceof Error) {
      const message = error.message
      
      // 特定のエラーメッセージを日本語で分かりやすく
      if (message.includes('timeout') || message.includes('タイムアウト')) {
        errorMessage = 'AVIFエンコードがタイムアウトしました。画像サイズを縮小するか、品質を下げてください。'
      } else if (message.includes('memory') || message.includes('メモリ')) {
        errorMessage = 'メモリ不足によりAVIFエンコードに失敗しました。画像サイズを縮小してください。'
      } else if (message.includes('WASM') || message.includes('wasm') || message.includes('WebAssembly')) {
        errorMessage = 'WASMモジュールの読み込みに失敗しました。ブラウザがWebAssemblyをサポートしているか確認してください。'
      } else if (message.includes('fetch') || message.includes('network') || message.includes('Network')) {
        errorMessage = 'AVIFエンコード処理に失敗しました。ネットワーク接続を確認してください。'
      } else {
        errorMessage = `AVIFエンコードに失敗しました: ${message}`
      }
    } else if (typeof error === 'string') {
      errorMessage = `AVIFエンコードに失敗しました: ${error}`
    }
    
    console.error('AVIFエンコードエラー詳細:', error)
    throw new Error(errorMessage)
  }
}

// ブラウザネイティブAPIを使用したエンコード（JPG/PNG/WebP用）
async function encodeWithCanvas(
  imageData: ImageData,
  format: OutputFormat,
  options: CodecOptions
): Promise<ArrayBuffer> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas context not available')
  }

  ctx.putImageData(imageData, 0, 0)

  let mimeType: string
  let quality: number | undefined

  switch (format) {
    case 'jpg':
      mimeType = 'image/jpeg'
      quality = options.quality ? options.quality / 100 : 0.8
      break
    case 'png':
      mimeType = 'image/png'
      break
    case 'webp':
      mimeType = 'image/webp'
      quality = options.quality ? options.quality / 100 : 0.8
      break
    default:
      throw new Error(`Unsupported format for canvas encoding: ${format}`)
  }

  const blob = await canvas.convertToBlob({
    type: mimeType,
    quality,
  })

  return blob.arrayBuffer()
}

export function mapQualityToCodecOptions(
  format: OutputFormat,
  quality: number,
  nearLossless?: boolean
): CodecOptions {
  const options: CodecOptions = {}

  switch (format) {
    case 'jpg':
      // 品質 0-100 を 40-92 にマッピング
      options.quality = Math.round(40 + (quality / 100) * 52)
      break

    case 'webp':
      options.quality = Math.round(40 + (quality / 100) * 52)
      if (nearLossless) {
        options.nearLossless = true
      }
      break

    case 'avif':
      // @jsquash/avif用の品質設定（0-100をそのまま使用）
      options.quality = Math.round(quality)
      // speedオプション（0-10、10が最速）
      // パフォーマンス重視のため、常に高速設定を使用
      options.speed = 10  // 最速設定でパフォーマンスを優先
      break

    case 'png':
      // PNG用の圧縮レベル (0-9)
      options.level = Math.round((quality / 100) * 9)
      break
  }

  return options
}

export interface EncodeResult {
  data: ArrayBuffer
  actualFormat: OutputFormat
}

export async function encodeImage(
  imageData: ImageData,
  format: OutputFormat,
  options: CodecOptions
): Promise<EncodeResult> {
  // AVIFの場合はブラウザ側で@jsquash/avifを使用
  if (format === 'avif') {
    const data = await encodeAVIFInBrowser(imageData, options)
    return { data, actualFormat: 'avif' }
  }
  
  // その他の形式はブラウザネイティブAPIを使用
  const data = await encodeWithCanvas(imageData, format, options)
  return { data, actualFormat: format }
}
