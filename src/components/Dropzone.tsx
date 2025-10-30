import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { validateFiles } from '../lib/validation'
import { createPreviewUrl } from '../lib/imageUtils'
import { processAllImages } from '../lib/processor'

export function Dropzone() {
  const { t } = useTranslation()
  const addFiles = useAppStore((state) => state.addFiles)
  const setProcessing = useAppStore((state) => state.setProcessing)
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const { valid, errors: validationErrors } = validateFiles(fileArray)

      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        setTimeout(() => setErrors([]), 5000)
      }

      if (valid.length > 0) {
        addFiles(valid)

        // プレビュー用のURLを生成
        for (const file of valid) {
          const preview = await createPreviewUrl(file)
          const fileId = `${file.name}-${file.size}-${file.lastModified}`
          useAppStore.getState().updateFile(fileId, { preview })
        }

        // 自動的に変換を開始
        setProcessing(true)
        try {
          await processAllImages()
        } catch (error) {
          console.error('処理エラー:', error)
        } finally {
          setProcessing(false)
        }
      }
    },
    [addFiles, setProcessing]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files)
      }
      e.target.value = ''
    },
    [handleFiles]
  )

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <input
          type="file"
          id="file-input"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileInput}
          className="hidden"
        />
        <label
          htmlFor="file-input"
          className="cursor-pointer flex flex-col items-center gap-4"
        >
          <svg
            className="w-16 h-16 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {t('dropzone.dragDrop')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t('dropzone.orClick')}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t('dropzone.supportedFormats')}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t('dropzone.maxFileSize')}
            </p>
          </div>
        </label>
      </div>

      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">{t('dropzone.error')}</p>
          <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-400 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

