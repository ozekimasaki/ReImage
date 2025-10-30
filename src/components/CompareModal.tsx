import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../store/useAppStore'
import { formatFileSize, calculateReductionRate } from '../lib/imageUtils'

type ViewMode = 'original' | 'processed'

export function CompareModal() {
  const { t } = useTranslation()
  const compareFileId = useAppStore((state) => state.compareFileId)
  const files = useAppStore((state) => state.files)
  const closeCompareModal = useAppStore((state) => state.closeCompareModal)

  const file = files.find((f) => f.id === compareFileId)
  const [viewMode, setViewMode] = useState<ViewMode>('original')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number
    height: number
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCompareModal()
      } else if (e.key === 'ArrowLeft') {
        setViewMode('original')
      } else if (e.key === 'ArrowRight') {
        setViewMode('processed')
      } else if (e.key === '0' || e.key === 'Home') {
        setZoom(1)
        setPan({ x: 0, y: 0 })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeCompareModal])

  useEffect(() => {
    if (zoom === 1) {
      setPan({ x: 0, y: 0 })
    }
  }, [zoom])

  // マウスダウン処理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [zoom, pan])

  // グローバルマウス移動処理（より滑らかなパン操作）
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning && zoom > 1) {
        const newPan = {
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        }
        
        // パンの境界を制限（画像が画面から完全に出ないように）
        const container = containerRef.current
        const image = imageRef.current
        if (container && image) {
          const containerRect = container.getBoundingClientRect()
          const imageRect = image.getBoundingClientRect()
          const maxPanX = Math.max(0, (imageRect.width * zoom - containerRect.width) / 2)
          const maxPanY = Math.max(0, (imageRect.height * zoom - containerRect.height) / 2)
          
          newPan.x = Math.max(-maxPanX, Math.min(maxPanX, newPan.x))
          newPan.y = Math.max(-maxPanY, Math.min(maxPanY, newPan.y))
        }
        
        setPan(newPan)
      }
    }

    const handleGlobalMouseUp = () => {
      setIsPanning(false)
    }

    if (isPanning) {
      window.addEventListener('mousemove', handleGlobalMouseMove)
      window.addEventListener('mouseup', handleGlobalMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove)
        window.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isPanning, zoom, panStart])

  // ホイールイベント（ズーム中心点をマウス位置に設定）
  useEffect(() => {
    if (!file || !file.processed) return

    let handleWheel: ((e: WheelEvent) => void) | null = null

    // コンテナがマウントされるまで少し待つ
    const timer = setTimeout(() => {
      const container = containerRef.current
      if (!container) return

      handleWheel = (e: WheelEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const rect = container.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setZoom((prevZoom) => {
          const newZoom = Math.max(0.5, Math.min(5, prevZoom * delta))
          
          // ズーム中心点をマウス位置に設定
          if (newZoom !== prevZoom) {
            const zoomRatio = newZoom / prevZoom
            const containerCenterX = rect.width / 2
            const containerCenterY = rect.height / 2
            
            setPan((prevPan) => {
              const offsetX = mouseX - containerCenterX
              const offsetY = mouseY - containerCenterY
              
              return {
                x: offsetX - (offsetX - prevPan.x) * zoomRatio,
                y: offsetY - (offsetY - prevPan.y) * zoomRatio,
              }
            })
          }
          
          return newZoom
        })
      }

      container.addEventListener('wheel', handleWheel, { passive: false })
    }, 100)

    return () => {
      clearTimeout(timer)
      if (handleWheel) {
        const container = containerRef.current
        if (container) {
          container.removeEventListener('wheel', handleWheel)
        }
      }
    }
  }, [file]) // fileが変更されたときに再登録

  useEffect(() => {
    if (file?.preview) {
      const img = new Image()
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height })
      }
      img.src = file.preview
    }
  }, [file?.preview])

  const [originalUrl, setOriginalUrl] = useState<string>('')
  const [processedUrl, setProcessedUrl] = useState<string>('')

  useEffect(() => {
    if (file) {
      const origUrl = file.preview || URL.createObjectURL(file.file)
      const procUrl = file.processed
        ? URL.createObjectURL(file.processed.blob)
        : ''
      setOriginalUrl(origUrl)
      setProcessedUrl(procUrl)

      return () => {
        if (!file.preview && origUrl.startsWith('blob:')) {
          URL.revokeObjectURL(origUrl)
        }
        if (procUrl.startsWith('blob:')) {
          URL.revokeObjectURL(procUrl)
        }
      }
    }
  }, [file])

  if (!file || !file.processed || !originalUrl || !processedUrl) {
    return null
  }

  const currentImageUrl = viewMode === 'original' ? originalUrl : processedUrl
  const currentImageLabel =
    viewMode === 'original'
      ? t('compareModal.originalImage')
      : `${t('compareModal.convertedImage')} (${file.processed.format.toUpperCase()})`

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
      onClick={closeCompareModal}
    >
      <div
        className="relative w-full h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-75 text-white p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <h2 className="text-xl font-bold">{file.file.name}</h2>
              <div className="text-sm mt-1 space-y-1">
                <p>
                  {t('compareModal.originalSize')}: {formatFileSize(file.file.size)}
                  {originalDimensions &&
                    ` (${originalDimensions.width} × ${originalDimensions.height}px)`}
                </p>
                <p>
                  {t('compareModal.convertedSize')}: {formatFileSize(file.processed.size)} (
                  {file.processed.width} × {file.processed.height}px)
                </p>
                <p className="text-green-400">
                  {t('compareModal.reductionRate')}:{' '}
                  {calculateReductionRate(
                    file.processed.originalSize,
                    file.processed.size
                  )}
                  %
                </p>
              </div>
            </div>
            <button
              onClick={closeCompareModal}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors font-medium"
            >
              {t('compareModal.close')}
            </button>
          </div>
        </div>

        {/* 画像ビュー */}
        <div
          ref={containerRef}
          className={`flex-1 relative overflow-hidden ${
            isPanning && zoom > 1 ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-default'
          }`}
          onMouseDown={handleMouseDown}
          style={{ touchAction: 'none' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              ref={imageRef}
              className="relative transition-transform duration-75 ease-out"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={currentImageUrl}
                alt={currentImageLabel}
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
            </div>
          </div>

          {/* 画像ラベル */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded backdrop-blur-sm font-medium">
            {currentImageLabel}
          </div>

          {/* 切り替えボタン（左右） */}
          <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-20">
            <button
              onClick={() => setViewMode('original')}
              className={`w-14 h-14 rounded-full bg-black bg-opacity-75 text-white flex items-center justify-center hover:bg-opacity-90 transition-all backdrop-blur-sm shadow-lg ${
                viewMode === 'original' ? 'ring-2 ring-blue-500 scale-110' : ''
              }`}
              title={t('compareModal.switchToOriginal')}
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20">
            <button
              onClick={() => setViewMode('processed')}
              className={`w-14 h-14 rounded-full bg-black bg-opacity-75 text-white flex items-center justify-center hover:bg-opacity-90 transition-all backdrop-blur-sm shadow-lg ${
                viewMode === 'processed' ? 'ring-2 ring-blue-500 scale-110' : ''
              }`}
              title={t('compareModal.switchToConverted')}
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* コントロール */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black bg-opacity-75 text-white p-4 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* 切り替えボタン */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setViewMode('original')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  viewMode === 'original'
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {t('compareModal.originalImage')}
              </button>
              <button
                onClick={() => setViewMode('processed')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  viewMode === 'processed'
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {t('compareModal.convertedImage')} ({file.processed.format.toUpperCase()})
              </button>
            </div>

            {/* ズーム */}
            <div className="flex items-center justify-center gap-4">
              <span className="text-sm font-medium min-w-[100px] text-right">
                {t('compareModal.zoom')}: {(zoom * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
                className="w-10 h-10 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded font-bold text-lg transition-colors"
                title={t('compareModal.zoomOut')}
              >
                −
              </button>
              <button
                onClick={() => {
                  setZoom(1)
                  setPan({ x: 0, y: 0 })
                }}
                className="px-4 py-1 bg-gray-700 hover:bg-gray-600 rounded font-medium transition-colors"
                title={`${t('compareModal.reset')} (0)`}
              >
                {t('compareModal.reset')}
              </button>
              <button
                onClick={() => setZoom((prev) => Math.min(5, prev + 0.1))}
                className="w-10 h-10 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded font-bold text-lg transition-colors"
                title={t('compareModal.zoomIn')}
              >
                +
              </button>
            </div>

            {/* 操作ヒント */}
            <div className="text-xs text-gray-400 text-center">
              <span>{t('compareModal.hints.wheel')}</span>
              <span className="mx-2">|</span>
              <span>{t('compareModal.hints.drag')}</span>
              <span className="mx-2">|</span>
              <span>{t('compareModal.hints.switch')}</span>
              <span className="mx-2">|</span>
              <span>{t('compareModal.hints.reset')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
