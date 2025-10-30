import { zip } from 'fflate'
import type { ImageFile } from '../types'
import { useAppStore } from '../store/useAppStore'

function getOutputFilename(
  originalName: string,
  format: string,
  width: number,
  quality: number
): string {
  const baseName = originalName.replace(/\.[^.]+$/, '')
  return `${baseName}_w${width}_q${quality}.${format}`
}

export async function zipFiles(files: ImageFile[]) {
  const filesToZip: Record<string, Uint8Array> = {}
  const settings = useAppStore.getState().settings

  for (const file of files) {
    if (!file.processed) continue

    const filename = getOutputFilename(
      file.file.name,
      file.processed.format,
      file.processed.width,
      settings.quality
    )

    const arrayBuffer = await file.processed.blob.arrayBuffer()
    filesToZip[filename] = new Uint8Array(arrayBuffer)
  }

  return new Promise<void>((resolve, reject) => {
    zip(filesToZip, { level: 6 }, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      const blob = new Blob([data as BlobPart], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reimage-processed-${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      resolve()
    })
  })
}

