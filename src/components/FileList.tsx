import { useTranslation } from 'react-i18next'
import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatFileSize, calculateReductionRate } from '../lib/imageUtils'

export function FileList() {
  const { t } = useTranslation()
  const files = useAppStore((state) => state.files)
  const removeFile = useAppStore((state) => state.removeFile)
  const openCompareModal = useAppStore((state) => state.openCompareModal)
  
  // 変換後のサムネイルURLを管理
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<string, string>>(new Map())
  const prevUrlsRef = useRef<Map<string, string>>(new Map())
  
  // 変換完了したファイルのサムネイルURLを生成
  useEffect(() => {
    const newUrls = new Map<string, string>()
    
    files.forEach((file) => {
      if (file.processed) {
        // 既存のURLがあれば再利用、なければ新規作成
        const existingUrl = prevUrlsRef.current.get(file.id)
        if (existingUrl) {
          newUrls.set(file.id, existingUrl)
        } else {
          const url = URL.createObjectURL(file.processed.blob)
          newUrls.set(file.id, url)
        }
      }
    })
    
    // 削除されたファイルのURLをクリーンアップ
    const urlsToCleanup = new Map(prevUrlsRef.current)
    urlsToCleanup.forEach((url, fileId) => {
      if (!newUrls.has(fileId)) {
        URL.revokeObjectURL(url)
      }
    })
    
    prevUrlsRef.current = newUrls
    setThumbnailUrls(newUrls)
    
    // コンポーネントのアンマウント時に全URLをクリーンアップ
    return () => {
      prevUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url)
      })
      prevUrlsRef.current.clear()
    }
  }, [files])

  if (files.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">{t('fileList.title')} ({files.length})</h2>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium text-gray-900 truncate">
                    {file.file.name}
                  </p>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      file.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : file.status === 'processing'
                          ? 'bg-blue-100 text-blue-800'
                          : file.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {file.status === 'completed'
                      ? t('fileList.status.completed')
                      : file.status === 'processing'
                        ? t('fileList.status.processing')
                        : file.status === 'error'
                          ? t('fileList.status.error')
                          : t('fileList.status.pending')}
                  </span>
                </div>
                
                {/* 変換後のサムネイル表示 */}
                {file.processed && thumbnailUrls.has(file.id) && (
                  <div className="mb-2">
                    <img
                      src={thumbnailUrls.get(file.id)}
                      alt={`${file.file.name} - ${t('fileList.converted')}`}
                      className="w-32 h-32 object-contain border border-gray-200 rounded bg-gray-50"
                    />
                  </div>
                )}

                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    {t('fileList.originalSize')}: {formatFileSize(file.file.size)} (
                    {file.file.type})
                  </p>

                  {file.status === 'processing' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {file.progress}%
                      </p>
                    </div>
                  )}

                  {file.processed && (
                    <>
                      <p>
                        {t('fileList.converted')}: {formatFileSize(file.processed.size)} (
                        {file.processed.format.toUpperCase()})
                      </p>
                      <p>
                        {file.processed.width} × {file.processed.height}px
                      </p>
                      <p className="text-green-600 font-medium">
                        {t('fileList.reductionRate')}:{' '}
                        {calculateReductionRate(
                          file.processed.originalSize,
                          file.processed.size
                        )}
                        %
                      </p>
                    </>
                  )}

                  {file.error && (
                    <p className="text-red-600 text-xs mt-1">{file.error}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {file.processed && (
                  <button
                    onClick={() => openCompareModal(file.id)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    {t('fileList.compare')}
                  </button>
                )}
                <button
                  onClick={() => removeFile(file.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  {t('fileList.delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

