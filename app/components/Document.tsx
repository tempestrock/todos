import { Links, Meta, Scripts, ScrollRestoration, LiveReload } from '@remix-run/react'
import { useEffect, useState } from 'react'

import { TranslationProvider } from '~/contexts/TranslationContext'
import { UNDEF } from '~/types/dataTypes'
import { LANG_DEFAULT } from '~/utils/language'

/**
 * The root document component, responsible for rendering the full HTML document structure, including the
 * language context provider.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children The children nodes to render.
 * @return {JSX.Element} The JSX element representing the full HTML document.
 */
export default function Document({ children }: { children: React.ReactNode }): JSX.Element {
  const [language, setLanguage] = useState(UNDEF) // no default language

  useEffect(() => {
    // Initially look up the local storage for the setting of the dark mode and apply if set.
    const isDarkMode = localStorage.getItem('darkMode') === 'true'
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    }

    // Initially look up the local storage for the display language and apply if set.
    if (typeof window !== 'undefined') {
      const lang = localStorage.getItem('lang')
      if (lang) {
        setLanguage(lang)
      } else {
        // If no language preference is set, set to default.
        setLanguage(LANG_DEFAULT)
      }
    }
  }, [])

  return (
    <TranslationProvider language={language} setLanguage={setLanguage}>
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body className="bg-white dark:bg-gray-900">
          {children}
          <ScrollRestoration />
          <Scripts />
          {process.env.NODE_ENV === 'development' && <LiveReload />}
        </body>
      </html>
    </TranslationProvider>
  )
}
