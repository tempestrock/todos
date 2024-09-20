import { useTranslation } from '../context/TranslationContext'

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useTranslation()

  const changeLanguage = (lang: string) => {
    if (lang !== language) {
      console.log(`[changeLanguage] changing language to ${lang}.`)
      setLanguage(lang)
    }
  }

  return (
    <div className="flex gap-4 mb-4">
      <button onClick={() => changeLanguage('en')} disabled={language === 'en'}>
        en
      </button>
      <button onClick={() => changeLanguage('de')} disabled={language === 'de'}>
        de
      </button>
    </div>
  )
}
