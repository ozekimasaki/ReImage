import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './pages/App'
import './index.css'
import './i18n'
import { useAppStore } from './store/useAppStore'
import i18n from './i18n'

// 保存された言語設定を読み込んでi18nに適用
const savedLanguage = useAppStore.getState().settings.language || 'en'
i18n.changeLanguage(savedLanguage)

// HTMLのlang属性を更新
document.documentElement.lang = savedLanguage

// 保存されたテーマ設定を読み込んで適用
const savedTheme = useAppStore.getState().settings.theme || 'system'
useAppStore.getState().setTheme(savedTheme)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

