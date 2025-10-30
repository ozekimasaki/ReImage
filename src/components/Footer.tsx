import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            <p>
              © {currentYear} {t('footer.copyright')}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            <p>{t('footer.version')}: 0.1.0</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

