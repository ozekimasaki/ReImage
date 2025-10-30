import { useTranslation } from 'react-i18next'
import { Dropzone } from '../components/Dropzone'
import { FileList } from '../components/FileList'
import { SettingsPanel } from '../components/SettingsPanel'
import { CompareModal } from '../components/CompareModal'
import { useAppStore } from '../store/useAppStore'
import { ProcessButton } from '../components/ProcessButton'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Footer } from '../components/Footer'

export default function App() {
  const { t } = useTranslation()
  const files = useAppStore((state) => state.files)
  const compareModalOpen = useAppStore((state) => state.compareModalOpen)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">{t('header.title')}</h1>
              <p className="text-sm text-gray-600">
                {t('header.subtitle')}
              </p>
            </div>
            <LanguageSwitcher />
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
          <div className="mt-8 bg-white rounded-lg shadow p-6">
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

