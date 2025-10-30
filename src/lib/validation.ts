import i18n from '../i18n'

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif']

export function isImageFile(file: File): boolean {
  return (
    SUPPORTED_FORMATS.includes(file.type) ||
    SUPPORTED_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )
  )
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!isImageFile(file)) {
    return {
      valid: false,
      error: `${i18n.t('validation.unsupportedFormat')}: ${file.name}`,
    }
  }

  // ブラウザでの処理を考慮した実用的な制限（50MB）
  // 注: ファイルサイズが大きいと、デコード後のメモリ使用量が数倍になる可能性があります
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `${i18n.t('validation.fileTooLarge')}: ${file.name} (${i18n.t('validation.maxSize')})`,
    }
  }

  return { valid: true }
}

export function validateFiles(files: File[]): {
  valid: File[]
  errors: string[]
} {
  const valid: File[] = []
  const errors: string[] = []

  for (const file of files) {
    const result = validateFile(file)
    if (result.valid) {
      valid.push(file)
    } else if (result.error) {
      errors.push(result.error)
    }
  }

  return { valid, errors }
}

