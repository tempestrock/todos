import { useTranslation } from '~/contexts/TranslationContext'

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useTranslation()

  const changeLanguage = (lang: string) => {
    if (lang !== language) {
      console.log(`[changeLanguage] changing language to ${lang}.`)
      setLanguage(lang)
    }
  }

  return (
    <div className="flex items-center">
      <button
        onClick={() => changeLanguage('en')}
        disabled={language === 'en'}
        className={`px-2 ${
          language === 'en'
            ? 'text-gray-900 dark:text-gray-100'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:font-bold'
        }`}
      >
        English
      </button>
      <span className="text-gray-400 dark:text-gray-600">|</span>
      <button
        onClick={() => changeLanguage('de')}
        disabled={language === 'de'}
        className={`px-2 ${
          language === 'de'
            ? 'text-gray-900 dark:text-gray-100'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:font-bold'
        }`}
      >
        Deutsch
      </button>
    </div>
  )
}
