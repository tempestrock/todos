import { useTranslation } from '~/contexts/TranslationContext'
import { LANG_DE, LANG_EN } from '~/utils/language'

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useTranslation()

  const changeLanguage = (lang: string) => {
    if (lang !== language) {
      setLanguage(lang)
    }
  }

  return (
    <div className="flex items-center">
      <button
        onClick={() => changeLanguage(LANG_EN)}
        disabled={language === LANG_EN}
        className={`px-2 ${
          language === LANG_EN
            ? 'text-gray-900 dark:text-gray-100'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:font-bold'
        }`}
      >
        English
      </button>
      <span className="text-gray-400 dark:text-gray-600">|</span>
      <button
        onClick={() => changeLanguage(LANG_DE)}
        disabled={language === LANG_DE}
        className={`px-2 ${
          language === LANG_DE
            ? 'text-gray-900 dark:text-gray-100'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:font-bold'
        }`}
      >
        Deutsch
      </button>
    </div>
  )
}
