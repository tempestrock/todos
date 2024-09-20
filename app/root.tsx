import type { LinksFunction, MetaFunction } from '@remix-run/node'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react'
import { useEffect } from 'react'

import styles from './tailwind.css?url'

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
  // Initially looks up the local storage for the setting of the dark mode and applies if set.
  useEffect(() => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true'
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <Links />
      </head>
      <body className="bg-white dark:bg-gray-900">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
