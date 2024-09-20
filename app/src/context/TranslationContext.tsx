// src/context/TranslationContext.tsx
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'

// Import your translation files
import deTranslations from '../translations/de.json'
import enTranslations from '../translations/en.json'

interface Translations {
  [key: string]: string
}

interface TranslationContextProps {
  language: string
  t: Translations
  setLanguage: (lang: string) => void
}

const TranslationContext = createContext<TranslationContextProps | undefined>(undefined)

// Create a mapping of languages to translations
const translationsMap: { [key: string]: Translations } = {
  en: enTranslations,
  de: deTranslations,
  // Add more languages here
}

export const TranslationProvider = ({
  children,
  language,
  setLanguage,
}: {
  children: ReactNode
  language: string
  setLanguage: (lang: string) => void
}) => {
  const [translations, setTranslations] = useState<Translations>(translationsMap[language] || {})

  useEffect(() => {
    // Update translations when language changes
    setTranslations(translationsMap[language] || {})

    // Save the language preference in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', language)
    }
  }, [language])

  const value: TranslationContextProps = {
    language,
    t: translations,
    setLanguage,
  }

  return (
    <TranslationContext.Provider value={value}>
      {/* Since translations are synchronously available, we can render children immediately */}
      {children}
    </TranslationContext.Provider>
  )
}

export const useTranslation = (): TranslationContextProps => {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}
