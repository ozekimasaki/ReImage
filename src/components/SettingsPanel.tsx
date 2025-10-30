import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore, Preset, OutputFormat } from '../store/useAppStore'
import { processAllImages } from '../lib/processor'

const PRESETS: Record<Preset, { quality: number; maxDimension: number }> = {
  'high-quality': { quality: 95, maxDimension: 4096 },
  balanced: { quality: 80, maxDimension: 2048 },
  'high-compression': { quality: 60, maxDimension: 1920 },
}

export function SettingsPanel() {
  const { t } = useTranslation()
  const settings = useAppStore((state) => state.settings)
  const setSettings = useAppStore((state) => state.setSettings)
  const files = useAppStore((state) => state.files)
  const isProcessing = useAppStore((state) => state.isProcessing)
  const setProcessing = useAppStore((state) => state.setProcessing)
  const prevSettingsRef = useRef(settings)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 設定変更時に自動再変換を実行
  useEffect(() => {
    // 設定が変更されたかチェック
    const hasChanged =
      prevSettingsRef.current.preset !== settings.preset ||
      prevSettingsRef.current.outputFormat !== settings.outputFormat ||
      prevSettingsRef.current.quality !== settings.quality ||
      prevSettingsRef.current.maxDimension !== settings.maxDimension ||
      prevSettingsRef.current.nearLossless !== settings.nearLossless

    // 変更がない場合はスキップ
    if (!hasChanged) {
      return
    }

    // 処理済みファイルがない場合はスキップ
    const hasCompletedFiles = files.some(
      (f) => f.status === 'completed' || f.status === 'error'
    )
    if (!hasCompletedFiles) {
      prevSettingsRef.current = { ...settings }
      return
    }

    // 既に処理中の場合はスキップ
    if (isProcessing) {
      prevSettingsRef.current = { ...settings }
      return
    }

    // デバウンス処理（500ms）
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(async () => {
      // 最新の状態を取得
      const state = useAppStore.getState()
      
      // 既に処理中の場合はスキップ
      if (state.isProcessing) {
        prevSettingsRef.current = { ...state.settings }
        return
      }

      // すべてのファイルをpending状態に戻す
      state.files.forEach((file) => {
        if (file.status === 'completed' || file.status === 'error') {
          state.updateFile(file.id, {
            status: 'pending',
            progress: 0,
            processed: undefined,
            error: undefined,
          })
        }
      })

      setProcessing(true)
      try {
        await processAllImages()
      } catch (error) {
        console.error('自動再変換エラー:', error)
      } finally {
        setProcessing(false)
      }
      
      // 処理完了後に最新の設定を更新
      const latestState = useAppStore.getState()
      prevSettingsRef.current = { ...latestState.settings }
    }, 500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [settings, files, isProcessing, setProcessing])

  const handlePresetChange = (preset: Preset) => {
    const presetConfig = PRESETS[preset]
    setSettings({
      preset,
      quality: presetConfig.quality,
      maxDimension: presetConfig.maxDimension,
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('settings.title')}</h2>

      <div className="space-y-6">
        {/* プリセット */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('settings.preset')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['high-quality', 'balanced', 'high-compression'] as Preset[]).map(
              (preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetChange(preset)}
                  className={`px-4 py-2 text-sm rounded transition-colors ${
                    settings.preset === preset
                      ? 'bg-blue-600 dark:bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {preset === 'high-quality'
                    ? t('settings.presets.highQuality')
                    : preset === 'balanced'
                      ? t('settings.presets.balanced')
                      : t('settings.presets.highCompression')}
                </button>
              )
            )}
          </div>
        </div>

        {/* 出力形式 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('settings.outputFormat')}
          </label>
          <select
            value={settings.outputFormat}
            onChange={(e) =>
              setSettings({ outputFormat: e.target.value as OutputFormat })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="original">{t('settings.outputFormats.original')}</option>
            <option value="jpg">{t('settings.outputFormats.jpg')}</option>
            <option value="png">{t('settings.outputFormats.png')}</option>
            <option value="webp">{t('settings.outputFormats.webp')}</option>
            <option value="avif">{t('settings.outputFormats.avif')}</option>
          </select>
        </div>

        {/* 品質 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('settings.quality')}: {settings.quality}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.quality}
            onChange={(e) =>
              setSettings({ quality: parseInt(e.target.value, 10) })
            }
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{t('settings.qualityRange.low')}</span>
            <span>{t('settings.qualityRange.high')}</span>
          </div>
        </div>

        {/* 最大長辺 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('settings.maxDimension')}
          </label>
          <input
            type="number"
            min="100"
            max="8192"
            step="100"
            value={settings.maxDimension}
            onChange={(e) =>
              setSettings({ maxDimension: parseInt(e.target.value, 10) })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('settings.maxDimensionHint')}
          </p>
        </div>

        {/* Near-lossless (WebP/AVIF用) */}
        {(settings.outputFormat === 'webp' ||
          settings.outputFormat === 'avif') && (
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.nearLossless || false}
                onChange={(e) =>
                  setSettings({ nearLossless: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.nearLossless')}
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              {t('settings.nearLosslessHint')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

