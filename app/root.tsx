import type { LinksFunction, MetaFunction } from '@remix-run/node'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react'
import { useEffect, useState } from 'react'

import { TranslationProvider } from '~/contexts/TranslationContext'
import styles from '~/styles/tailwind.css?url'

/**
 * Returns an array of links for the HTML document.
 *
 * @return An array of link tags.
 */
export const links: LinksFunction = () => [{ rel: 'stylesheet', href: styles }]

/**
 * Returns an array of meta tags for the HTML document.
 *
 * @return An array of meta tags.
 */
export const meta: MetaFunction = () => {
  return [
    { title: 'Todos' },
    { name: 'description', content: 'My todo lists' },
    { charset: 'utf-8' },
    { viewport: 'width=device-width,initial-scale=1' },
  ]
}

/**
 * The main application component, responsible for rendering the HTML document structure.
 *
 * @return {JSX.Element} The JSX element representing the HTML document.
 */
export default function App(): JSX.Element {
  const [language, setLanguage] = useState('en') // Default language

  useEffect(() => {
    console.log(`[App.useEffect] started`)
    // Initially looks up the local storage for the setting of the dark mode and applies if set.
    const isDarkMode = localStorage.getItem('darkMode') === 'true'
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    }

    // Initially look up the local storage for the display language and apply if set.
    if (typeof window !== 'undefined') {
      const lang = localStorage.getItem('lang')
      if (lang) {
        console.log(`[changeLanguage] changing language to ${lang}.`)
        // Update the language state
        setLanguage(lang)
      }
    }
  }, [])

  return (
    <TranslationProvider language={language} setLanguage={setLanguage}>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body className="bg-white dark:bg-gray-900">
          <Outlet />
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </TranslationProvider>
  )
}
