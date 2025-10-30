import { useAppStore } from '../store/useAppStore'
import { loadImageWithOrientation } from './imageUtils'
import { resizeImage } from './resize'
import {
  encodeImage,
  mapQualityToCodecOptions,
} from './codecs'
import type { OutputFormat } from '../types'

function mimeToOutputFormat(mimeType: string): OutputFormat {
  const lower = (mimeType || '').toLowerCase()
  if (lower.includes('jpeg') || lower.includes('jpg')) return 'jpg'
  if (lower.includes('png')) return 'png'
  if (lower.includes('webp')) return 'webp'
  if (lower.includes('avif')) return 'avif'
  return 'jpg'
}

async function processSingleImage(fileId: string) {
  const state = useAppStore.getState()
  const file = state.files.find((f) => f.id === fileId)
  if (!file || file.status !== 'pending') return

  const settings = state.settings
  let imageBitmap: ImageBitmap | null = null
  
  // 出力形式を決定（エラーハンドリングでも使用するため先に定義）
  const outputFormat: OutputFormat =
    settings.outputFormat === 'original'
      ? mimeToOutputFormat(file.file.type)
      : settings.outputFormat

  try {
    state.updateFile(fileId, { status: 'processing', progress: 0 })

    // 画像読み込み
    state.updateFile(fileId, { progress: 10 })
    const result = await loadImageWithOrientation(file.file)
    imageBitmap = result.imageBitmap

    // リサイズ
    state.updateFile(fileId, { progress: 30 })
    const { canvas, width, height } = await resizeImage(
      imageBitmap,
      settings.maxDimension
    )

    // ImageData取得
    state.updateFile(fileId, { progress: 50 })
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas context not available')
    }
    const imageData = ctx.getImageData(0, 0, width, height)

    // エンコード
    state.updateFile(fileId, { progress: 70 })
    const codecOptions = mapQualityToCodecOptions(
      outputFormat,
      settings.quality,
      settings.nearLossless
    )
    const encodeResult = await encodeImage(imageData, outputFormat, codecOptions)
    
    // 実際にエンコードされた形式を使用（AVIFがWebPにフォールバックされた場合も含む）
    const actualFormat = encodeResult.actualFormat

    // Blob作成
    const mimeType =
      actualFormat === 'jpg'
        ? 'image/jpeg'
        : actualFormat === 'png'
          ? 'image/png'
          : actualFormat === 'webp'
            ? 'image/webp'
            : actualFormat === 'avif'
              ? 'image/avif'
              : 'image/jpeg'

    const blob = new Blob([encodeResult.data], { type: mimeType })

    state.updateFile(fileId, {
      progress: 100,
      status: 'completed',
      processed: {
        blob,
        format: actualFormat,
        width,
        height,
        size: blob.size,
        originalSize: file.file.size,
      },
    })

    imageBitmap.close()
  } catch (error) {
    let errorMessage = '処理エラー'
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // AVIFエラーの場合、より詳細なログを出力
      if (errorMessage.includes('AVIF') || outputFormat === 'avif') {
        console.error('AVIFエンコードエラー詳細:', {
          message: error.message,
          stack: error.stack,
          fileId,
          fileName: file.file.name,
          fileSize: file.file.size,
          imageSize: imageBitmap ? `${imageBitmap.width}×${imageBitmap.height}` : 'unknown',
        })
        
        // AVIF固有のエラーメッセージ改善
        if (errorMessage.includes('タイムアウト')) {
          errorMessage = 'AVIF変換がタイムアウトしました。画像サイズを縮小するか、品質を下げてください。'
        } else if (errorMessage.includes('メモリ')) {
          errorMessage = 'メモリ不足によりAVIF変換に失敗しました。画像サイズを縮小してください。'
        } else if (!errorMessage.includes('AVIF')) {
          errorMessage = `AVIF変換エラー: ${errorMessage}`
        }
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    } else {
      // 予期しないエラー形式の場合
      errorMessage = `予期しないエラーが発生しました: ${String(error)}`
      console.error('予期しないエラー形式:', error)
    }
    
    // ImageBitmapが開いている場合はクリーンアップ
    if (imageBitmap) {
      try {
        imageBitmap.close()
      } catch (closeError) {
        console.warn('ImageBitmapのクローズエラー:', closeError)
      }
    }
    
    state.updateFile(fileId, {
      status: 'error',
      error: errorMessage,
    })
  }
}

export async function processAllImages() {
  const state = useAppStore.getState()
  const pendingFiles = state.files.filter((f) => f.status === 'pending')

  // CPUコア数に基づいて並列数を決定
  const cores = typeof navigator !== 'undefined' && (navigator as any).hardwareConcurrency ? (navigator as any).hardwareConcurrency as number : 2
  const maxWorkers = Math.max(1, cores - 1)
  const workers = Math.min(maxWorkers, pendingFiles.length)

  // バッチ処理（並列実行）
  for (let i = 0; i < pendingFiles.length; i += workers) {
    const batch = pendingFiles.slice(i, i + workers)
    await Promise.all(batch.map((file) => processSingleImage(file.id)))
  }
}

