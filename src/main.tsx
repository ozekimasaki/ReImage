import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './pages/App'
import './index.css'
import { useAppStore } from './store/useAppStore'
import { registerGlobalErrorHandlers } from './lib/errorHandling'

// 保存された言語設定を環境に適用（i18n + html lang）
const savedLanguage = useAppStore.getState().settings.language || 'en'
useAppStore.getState().setLanguage(savedLanguage)

// 保存されたテーマ設定を読み込んで適用
const savedTheme = useAppStore.getState().settings.theme || 'system'
useAppStore.getState().setTheme(savedTheme)

// グローバルエラーハンドラー登録
registerGlobalErrorHandlers()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

