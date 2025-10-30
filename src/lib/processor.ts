import { useAppStore } from '../store/useAppStore'
import { loadImageWithOrientation } from './imageUtils'
import { resizeImage } from './resize'
import {
  encodeImage,
  mapQualityToCodecOptions,
} from './codecs'
import type { OutputFormat } from '../types'

async function processSingleImage(fileId: string) {
  const state = useAppStore.getState()
  const file = state.files.find((f) => f.id === fileId)
  if (!file || file.status !== 'pending') return

  const settings = state.settings

  try {
    state.updateFile(fileId, { status: 'processing', progress: 0 })

    // 画像読み込み
    state.updateFile(fileId, { progress: 10 })
    const { imageBitmap, width: originalWidth, height: originalHeight } =
      await loadImageWithOrientation(file.file)

    // 出力形式を決定
    const outputFormat: OutputFormat =
      settings.outputFormat === 'original'
        ? (file.file.type.split('/')[1] as OutputFormat) || 'jpg'
        : settings.outputFormat

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
      // AVIFエラーの場合、より分かりやすいメッセージに変換
      if (errorMessage.includes('AVIF')) {
        console.error('AVIFエンコードエラー:', error)
      }
    } else if (typeof error === 'string') {
      errorMessage = error
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
  const maxWorkers = Math.max(1, navigator.hardwareConcurrency - 1)
  const workers = Math.min(maxWorkers, pendingFiles.length)

  // バッチ処理（並列実行）
  for (let i = 0; i < pendingFiles.length; i += workers) {
    const batch = pendingFiles.slice(i, i + workers)
    await Promise.all(batch.map((file) => processSingleImage(file.id)))
  }
}

