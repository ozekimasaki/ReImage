import { useTranslation } from 'react-i18next'
import { FaGithub } from 'react-icons/fa6'
import { FaXTwitter } from 'react-icons/fa6'

export function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>
              © {currentYear} {t('footer.copyright')}
            </p>
          </div>
          <div className="flex items-center gap-6">
            {/* ソーシャルリンク */}
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/ozekimasaki/ReImage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                aria-label="GitHub"
              >
                <FaGithub className="w-6 h-6" />
              </a>
              <a
                href="https://x.com/mei_999_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                aria-label="X (Twitter)"
              >
                <FaXTwitter className="w-6 h-6" />
              </a>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>{t('footer.version')}: 0.1.0</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

