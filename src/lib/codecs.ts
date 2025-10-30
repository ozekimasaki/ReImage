import type { OutputFormat, CodecOptions } from '../types'
import encodeAVIF from '@jsquash/avif/encode'

// @jsquash/avifを使用したAVIFエンコード
async function encodeAVIFWithJSSquash(
  imageData: ImageData,
  options: CodecOptions
): Promise<ArrayBuffer> {
  try {
    // @jsquash/avifのencode関数はImageDataオブジェクトを受け取る
    // 品質設定: 0-100をそのまま使用（@jsquash/avifは0-100の範囲をサポート）
    const quality = options.quality !== undefined 
      ? Math.max(0, Math.min(100, options.quality)) 
      : 80
    
    // speedオプション（0-10、0が最高品質）
    const speed = options.speed !== undefined ? options.speed : 4
    
    const encodeOptions: any = {
      quality,
      speed,
    }
    
    const encoded = await encodeAVIF(imageData, encodeOptions)
    
    if (!encoded) {
      throw new Error('AVIFエンコード結果が空です')
    }
    
    // @jsquash/avifのencodeはArrayBufferまたはUint8Arrayを返す
    if (encoded instanceof ArrayBuffer) {
      if (encoded.byteLength === 0) {
        throw new Error('AVIFエンコード結果が空です')
      }
      return encoded
    }
    
    // Uint8Arrayの場合は、新しいArrayBufferを作成して返す
    const uint8Array = encoded as Uint8Array
    if (uint8Array.byteLength === 0) {
      throw new Error('AVIFエンコード結果が空です')
    }
    // 新しいUint8Arrayを作成して、そのbufferを返す（確実にArrayBufferを取得）
    return new Uint8Array(uint8Array).buffer
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`AVIFエンコードに失敗しました: ${errorMessage}`)
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
      // speedオプション（0-10、デフォルトは6、低いほど高品質だが遅い）
      options.speed = quality > 80 ? 2 : quality > 50 ? 4 : 6
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
  // AVIFの場合は@jsquash/avifを使用
  if (format === 'avif') {
    const data = await encodeAVIFWithJSSquash(imageData, options)
    return { data, actualFormat: 'avif' }
  }
  
  // その他の形式はブラウザネイティブAPIを使用
  const data = await encodeWithCanvas(imageData, format, options)
  return { data, actualFormat: format }
}
