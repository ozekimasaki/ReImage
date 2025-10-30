import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'

export function ProcessButton() {
  const { t } = useTranslation()
  const files = useAppStore((state) => state.files)

  const completedCount = files.filter((f) => f.status === 'completed').length
  const hasPending = files.some((f) => f.status === 'pending')

  const handleDownloadAll = async () => {
    const completedFiles = files.filter((f) => f.processed)
    if (completedFiles.length === 0) return

    const { zipFiles } = await import('../lib/zip')
    await zipFiles(completedFiles)
  }

  return (
    <div className="flex gap-4">
      {hasPending && (
        <div className="flex-1 px-6 py-3 rounded-lg font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-center">
          {t('processButton.processing')}
        </div>
      )}

      {completedCount > 0 && (
        <button
          onClick={handleDownloadAll}
          className="flex-1 px-6 py-3 rounded-lg font-medium bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
        >
          {t('processButton.downloadZipCount', { count: completedCount })}
        </button>
      )}
    </div>
  )
}

