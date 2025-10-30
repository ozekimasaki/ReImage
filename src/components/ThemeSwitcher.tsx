import { useAppStore, Theme } from '../store/useAppStore'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'

export function ThemeSwitcher() {
  const { t } = useTranslation()
  const currentTheme = useAppStore((state) => state.settings.theme || 'system')
  const setTheme = useAppStore((state) => state.setTheme)

  // システム設定の変更を監視
  useEffect(() => {
    if (typeof window === 'undefined' || currentTheme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      // 現在のテーマがsystemの場合は即座に適用
      const root = document.documentElement
      if (e.matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [currentTheme])

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme)
  }

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: t('theme.light'), icon: '☀️' },
    { value: 'dark', label: t('theme.dark'), icon: '🌙' },
    { value: 'system', label: t('theme.system'), icon: '💻' },
  ]

  return (
    <div className="relative">
      <select
        value={currentTheme}
        onChange={(e) => handleThemeChange(e.target.value as Theme)}
        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer pr-6 sm:pr-8"
        aria-label={t('theme.selector')}
      >
        {themes.map((theme) => (
          <option key={theme.value} value={theme.value}>
            {theme.icon} {theme.label}
          </option>
        ))}
      </select>
      <div className="absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg
          className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  )
}

