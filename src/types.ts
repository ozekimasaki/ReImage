export type OutputFormat = 'jpg' | 'png' | 'webp' | 'avif' | 'original'

export interface CodecOptions {
  quality?: number
  nearLossless?: boolean
  speed?: number
  quantizer?: number
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

