import { useTranslation } from 'react-i18next'
import { Dropzone } from '../components/Dropzone'
import { FileList } from '../components/FileList'
import { SettingsPanel } from '../components/SettingsPanel'
import { CompareModal } from '../components/CompareModal'
import { useAppStore } from '../store/useAppStore'
import { ProcessButton } from '../components/ProcessButton'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { ThemeSwitcher } from '../components/ThemeSwitcher'
import { Footer } from '../components/Footer'

export default function App() {
  const { t } = useTranslation()
  const files = useAppStore((state) => state.files)
  const compareModalOpen = useAppStore((state) => state.compareModalOpen)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {t('header.title')}
              </h1>
              <p className="hidden sm:block text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {t('header.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム: ファイル一覧 */}
          <div className="lg:col-span-2 space-y-6">
            <Dropzone />
            <FileList />
          </div>

          {/* 右カラム: 設定 */}
          <div className="lg:col-span-1">
            <SettingsPanel />
          </div>
        </div>

        {/* 処理ボタンエリア */}
        {files.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <ProcessButton />
          </div>
        )}
      </main>

      {/* フッター */}
      <Footer />

      {/* 比較モーダル */}
      {compareModalOpen && <CompareModal />}
    </div>
  )
}

