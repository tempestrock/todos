import type { LinksFunction, MetaFunction } from '@remix-run/node'
import {
  isRouteErrorResponse,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useRouteError,
} from '@remix-run/react'
import { useEffect, useState } from 'react'

import { log } from './utils/log'
import { printObject } from './utils/printObject'
import { TranslationProvider } from '~/contexts/TranslationContext'
import styles from '~/styles/tailwind.css?url'
import { UNDEF } from '~/types/dataTypes'
import { LANG_DEFAULT } from '~/utils/language'

/**
 * Returns an array of links for the HTML document.
 *
 * @return An array of link tags.
 */
export const links: LinksFunction = () => [
  { rel: 'icon', href: '/favicon.ico' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  { rel: 'stylesheet', href: styles },
]

/**
 * Returns an array of meta tags for the HTML document.
 *
 * @return An array of meta tags.
 */
export const meta: MetaFunction = () => {
  return [
    { title: 'Todos' },
    { name: 'description', content: 'Todos' },
    { charset: 'utf-8' },
    { viewport: 'width=device-width,initial-scale=1' },
  ]
}

/**
 * Returns a set of security headers for the application.
 *
 * @return {Object} The security headers object.
 */
export const headers = (): object => {
  return {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy':
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data:; " +
      "font-src 'self'; " +
      "object-src 'none'; " +
      "frame-ancestors 'none'; " +
      "connect-src 'self'",
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'accelerometer=(), autoplay=(), camera=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), usb=(), clipboard-read=(), clipboard-write=()',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  }
}

/**
 * The main application component, responsible for rendering the HTML document structure.
 *
 * @return {JSX.Element} The JSX element representing the HTML document.
 */
export default function App(): JSX.Element {
  const [language, setLanguage] = useState(UNDEF) // no default language

  useEffect(() => {
    // Initially looks up the local storage for the setting of the dark mode and applies if set.
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
          <Outlet />
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </TranslationProvider>
  )
}

function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
        {/* Include any global styles or scripts here */}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  const location = useLocation()

  // Log the error on the server side
  if (typeof window === 'undefined') {
    log(`Error at location ${location.pathname}${location.search}`)
    printObject(error, 'ErrorBoundary')
  }

  // Check if the error is a Response (caught response)
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      // Custom 404 page
      return (
        <Document>
          <main className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
            <p className="mb-4">The page you requested does not exist. It might have been moved or deleted.</p>
            <p>
              <a href="/" className="text-blue-500 hover:underline">
                Return to the homepage
              </a>
            </p>
          </main>
        </Document>
      )
    } else {
      // Other HTTP errors
      return (
        <Document>
          <main className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">
              {error.status} {error.statusText}
            </h1>
            <p className="mb-4">An error occurred while processing your request.</p>
            <p>
              <a href="/" className="text-blue-500 hover:underline">
                Return to the homepage
              </a>
            </p>
          </main>
        </Document>
      )
    }
  } else {
    // Handle unexpected errors
    return (
      <Document>
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Application Error</h1>
          <p className="mb-4">Sorry, an unexpected error has occurred.</p>
          <pre className="bg-gray-100 p-4 rounded">{String(error)}</pre>
          <p>
            <a href="/" className="text-blue-500 hover:underline">
              Return to the homepage
            </a>
          </p>
        </main>
      </Document>
    )
  }
}
