/**
 * Cloudflare Worker for AVIF encoding
 * Processes AVIF conversion requests from the client
 */

// AVIFエンコード関数（@jsquash/avifを使用）
// モジュールレベルでインポート（Cloudflare Workersでは静的インポートが推奨）
// 注意: @jsquash/avifはブラウザ環境を想定しており、Cloudflare WorkersでのWASM読み込みに問題がある可能性があります
import encodeAVIFModule from '@jsquash/avif/encode'

// デバッグ用: モジュールの状態をログに記録
console.log('@jsquash/avif モジュール読み込み:', {
  moduleType: typeof encodeAVIFModule,
  hasDefault: !!(encodeAVIFModule as any).default,
  moduleKeys: Object.keys(encodeAVIFModule as any),
})

// ImageDataポリフィル（Cloudflare Workers環境用）
// Cloudflare WorkersではImageDataがグローバルに存在しない可能性があるため
class ImageDataPolyfill {
  data: Uint8ClampedArray
  width: number
  height: number
  
  constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight?: number, height?: number) {
    if (dataOrWidth instanceof Uint8ClampedArray) {
      // ImageData(data, width, height) 形式
      this.data = dataOrWidth
      this.width = widthOrHeight!
      this.height = height !== undefined ? height : dataOrWidth.length / (widthOrHeight! * 4)
    } else {
      // ImageData(width, height) 形式 - 空のImageDataを作成
      this.width = dataOrWidth
      this.height = widthOrHeight!
      this.data = new Uint8ClampedArray(dataOrWidth * widthOrHeight! * 4)
    }
  }
}

// グローバルにImageDataが存在しない場合のみポリフィルを使用
if (typeof (globalThis as any).ImageData === 'undefined') {
  // グローバルにImageDataを追加
  (globalThis as any).ImageData = ImageDataPolyfill
}

// ImageDataの型定義（型安全性のため）
type ImageDataType = {
  new (data: Uint8ClampedArray, width: number, height?: number): ImageDataPolyfill
  new (width: number, height: number): ImageDataPolyfill
}

export interface Env {
  // 静的アセットバインディング
  ASSETS: Fetcher
  // 環境変数が必要な場合はここに追加
}

interface AVIFEncodeRequest {
  imageData: {
    data: number[] // Uint8ClampedArrayを数値配列に変換
    width: number
    height: number
  }
  options: {
    quality?: number
    speed?: number
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    
    // APIエンドポイントの処理（/api/avif/encode）
    if (url.pathname.startsWith('/api/avif/encode')) {
      // CORS設定
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
          },
        })
      }

      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      try {
        const body: AVIFEncodeRequest = await request.json()

        // リクエストデータの検証
        if (!body.imageData || !body.imageData.data || !body.imageData.width || !body.imageData.height) {
          return new Response(
            JSON.stringify({ error: '無効な画像データです' }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          )
        }

        // ImageDataオブジェクトを再構築
        // ImageDataがグローバルに存在しない場合はポリフィルが使用される
        let ImageDataConstructor: ImageDataType
        try {
          // ImageDataが存在するかチェック（実行時チェック）
          // @ts-ignore - ImageDataが存在しない可能性があるため
          if (typeof ImageData !== 'undefined') {
            // @ts-ignore
            ImageDataConstructor = ImageData
          } else if (typeof (globalThis as any).ImageData !== 'undefined') {
            ImageDataConstructor = (globalThis as any).ImageData
          } else {
            // ポリフィルを使用
            ImageDataConstructor = ImageDataPolyfill as any
          }
        } catch (e) {
          // ImageDataが利用できない場合はポリフィルを使用
          ImageDataConstructor = ImageDataPolyfill as any
        }
        
        const imageData = new ImageDataConstructor(
          new Uint8ClampedArray(body.imageData.data),
          body.imageData.width,
          body.imageData.height
        )

        // AVIFエンコード処理
        const encoded = await encodeAVIF(imageData, body.options)

        // 結果をArrayBufferに変換
        let arrayBuffer: ArrayBuffer
        if (encoded instanceof ArrayBuffer) {
          arrayBuffer = encoded
        } else if (encoded instanceof Uint8Array) {
          // Uint8ArrayからArrayBufferを作成（型安全性のため）
          const copy = new Uint8Array(encoded)
          arrayBuffer = copy.buffer as ArrayBuffer
        } else {
          throw new Error('予期しないエンコード結果の形式です')
        }

        // Base64エンコードして返す（またはバイナリとして返す）
        return new Response(arrayBuffer, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Access-Control-Allow-Origin': '*',
            'Content-Length': arrayBuffer.byteLength.toString(),
          },
        })
      } catch (error) {
        console.error('AVIFエンコードエラー:', error)
        
        let errorMessage = 'AVIFエンコードに失敗しました'
        let errorDetails = 'Unknown error'
        
        if (error instanceof Error) {
          errorDetails = error.message
          const stack = error.stack
          
          // より詳細なエラーメッセージを生成
          if (errorDetails.includes('ImageData') || errorDetails.includes('is not defined')) {
            errorMessage = 'ImageData APIが利用できません。Cloudflare Workers環境の互換性の問題です。'
          } else if (errorDetails.includes('memory') || errorDetails.includes('Memory')) {
            errorMessage = 'メモリ不足によりAVIFエンコードに失敗しました。画像サイズを縮小してください。'
          } else if (errorDetails.includes('timeout') || errorDetails.includes('Timeout')) {
            errorMessage = 'AVIFエンコードがタイムアウトしました。画像サイズを縮小するか、品質を下げてください。'
          } else if (errorDetails.includes('WASM') || errorDetails.includes('wasm')) {
            errorMessage = 'WASMモジュールの読み込みに失敗しました。'
          } else if (errorDetails.includes('encode') || errorDetails.includes('Encode')) {
            errorMessage = `AVIFエンコード処理エラー: ${errorDetails}`
          } else {
            errorMessage = `AVIFエンコードに失敗しました: ${errorDetails}`
          }
          
          // スタックトレースをログに記録（本番環境では削除推奨）
          if (stack) {
            console.error('AVIFエンコードエラースタック:', stack)
          }
        } else if (typeof error === 'string') {
          errorDetails = error
          errorMessage = `AVIFエンコードに失敗しました: ${error}`
        } else {
          errorDetails = String(error)
          errorMessage = `AVIFエンコードに失敗しました: ${errorDetails}`
        }
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            details: errorDetails 
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }
    }
    
    // 静的アセットの配信（API以外のリクエスト）
    // 静的アセットにマッチしない場合は、SPA設定によりindex.htmlが返される
    return env.ASSETS.fetch(request)
  },
}

// AVIFエンコード関数
async function encodeAVIF(
  imageData: ImageDataPolyfill,
  options: { quality?: number; speed?: number }
): Promise<ArrayBuffer | Uint8Array> {
  const quality = options.quality !== undefined ? Math.max(0, Math.min(100, options.quality)) : 80
  const speed = options.speed !== undefined ? options.speed : 4

  const encodeOptions = {
    quality,
    speed,
  }

  try {
    // @jsquash/avifのencode関数を呼び出し
    let encodeAVIFFn: (imageData: any, options: any) => Promise<ArrayBuffer | Uint8Array>
    
    if (typeof encodeAVIFModule === 'function') {
      encodeAVIFFn = encodeAVIFModule
    } else if ((encodeAVIFModule as any).default) {
      encodeAVIFFn = (encodeAVIFModule as any).default
    } else {
      encodeAVIFFn = encodeAVIFModule as any
    }

    // ImageDataオブジェクトを渡す（ポリフィルでも@jsquash/avifは動作するはず）
    const encoded = await encodeAVIFFn(imageData, encodeOptions)

    if (!encoded) {
      throw new Error('AVIFエンコード結果が空です')
    }

    return encoded
  } catch (error) {
    // より詳細なエラー情報をログに記録
    console.error('encodeAVIF内部エラー:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      imageDataSize: `${imageData.width}x${imageData.height}`,
      options: encodeOptions,
      encodeAVIFModuleType: typeof encodeAVIFModule,
      hasDefault: !!(encodeAVIFModule as any).default,
    })
    
    // WASM関連のエラーを検出
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (
      errorMessage.includes('WASM') ||
      errorMessage.includes('wasm') ||
      errorMessage.includes('WebAssembly') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('network') ||
      errorMessage.includes('load')
    ) {
      throw new Error('WASMモジュールの読み込みに失敗しました。Cloudflare Workers環境での互換性の問題の可能性があります。')
    }
    
    // その他のエラーはそのまま再スロー
    throw error
  }
}

