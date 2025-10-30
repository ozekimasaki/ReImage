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

// グローバルエラーハンドラー（WorkerエラーやWASMエラーをキャッチ）
window.addEventListener('error', (event) => {
  // Chrome拡張機能のエラーを無視（runtime.lastError）
  if (
    event.message?.includes('runtime.lastError') ||
    event.message?.includes('extension port') ||
    event.message?.includes('back/forward cache')
  ) {
    // Chrome拡張機能のエラーは無視（拡張機能の問題でアプリ側では修正不可）
    return
  }

  // MobX State Treeのエラーを無視（プロジェクト外のライブラリの問題）
  if (
    event.message?.includes('mobx-state-tree') ||
    event.message?.includes('RecordingMachineModel') ||
    event.message?.includes('no longer part of a state tree')
  ) {
    // MobX State Treeエラーは無視（開発ツール拡張機能の問題）
    return
  }

  // AVIF関連のエラーを特定
  if (
    event.message?.includes('avif') ||
    event.message?.includes('AVIF') ||
    event.filename?.includes('avif') ||
    event.filename?.includes('worker')
  ) {
    console.error('AVIF処理エラー:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    })
    // エラーを処理中のファイルに伝播させるためのフラグ
    // 実際のエラー処理はprocessor.tsで行う
  }
})

// 未処理のPromise拒否をキャッチ（Workerエラーなど）
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  const reasonString = String(reason)
  const reasonMessage = reason?.message || reasonString

  // Chrome拡張機能のエラーを無視
  if (
    reasonMessage.includes('runtime.lastError') ||
    reasonMessage.includes('extension port') ||
    reasonMessage.includes('back/forward cache')
  ) {
    event.preventDefault() // エラーを抑制
    return
  }

  // MobX State Treeのエラーを無視
  if (
    reasonMessage.includes('mobx-state-tree') ||
    reasonMessage.includes('RecordingMachineModel') ||
    reasonMessage.includes('no longer part of a state tree')
  ) {
    event.preventDefault() // エラーを抑制
    return
  }

  // AVIF関連のエラーをログ出力
  if (
    reasonMessage.includes('avif') ||
    reasonMessage.includes('AVIF') ||
    reasonString.includes('avif')
  ) {
    console.error('AVIF処理Promise拒否:', event.reason)
    // エラーを処理中のファイルに伝播させるためのフラグ
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

