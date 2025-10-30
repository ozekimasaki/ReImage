import { useAppStore } from '../store/useAppStore'
import type { Language } from '../types'

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
]

export function LanguageSwitcher() {
  const currentLanguage = useAppStore((state) => state.settings.language || 'en')
  const setLanguage = useAppStore((state) => state.setLanguage)

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
  }

  return (
    <div className="relative">
      <select
        value={currentLanguage}
        onChange={(e) => handleLanguageChange(e.target.value as Language)}
        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer pr-6 sm:pr-8"
        aria-label="Language selector"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
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

