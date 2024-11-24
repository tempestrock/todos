import type { LinksFunction, MetaFunction } from '@remix-run/node'
import { Outlet } from '@remix-run/react'

import Document from '~/components/Document'
import ErrorBoundary from '~/components/ErrorBoundary'
import styles from '~/styles/tailwind.css?url'

/**
 * Returns an array of links for the HTML document.
 *
 * @return An array of link tags.
 */
export const links: LinksFunction = () => [
  { rel: 'manifest', href: '/manifest.json' },
  { rel: 'icon', href: '/favicon.png' },
  { rel: 'apple-touch-icon', href: '/icon-192x192.png' },
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
  return (
    <Document>
      <Outlet />
    </Document>
  )
}

export { ErrorBoundary }
