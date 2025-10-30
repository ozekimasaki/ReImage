export type OutputFormat = 'jpg' | 'png' | 'webp' | 'avif' | 'original'

export interface CodecOptions {
  quality?: number
  nearLossless?: boolean
  speed?: number
  quantizer?: number
  level?: number
}

export interface ResizeOptions {
  maxDimension: number
}

export interface ProcessOptions {
  format: OutputFormat
  resize: ResizeOptions
  codec: CodecOptions
}

export interface ProcessResult {
  blob: Blob
  format: OutputFormat
  width: number
  height: number
  size: number
  originalSize: number
}

// App-wide shared types (moved from store to avoid duplication)
export type Language = 'en' | 'ja' | 'zh'
export type Theme = 'light' | 'dark' | 'system'

export interface AppSettings {
  preset: 'high-quality' | 'balanced' | 'high-compression'
  outputFormat: OutputFormat
  quality: number
  maxDimension: number
  nearLossless?: boolean
  language?: Language
  theme?: Theme
}

export interface ImageFile {
  id: string
  file: File
  preview?: string
  processed?: {
    blob: Blob
    format: OutputFormat
    width: number
    height: number
    size: number
    originalSize: number
  }
  progress: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

