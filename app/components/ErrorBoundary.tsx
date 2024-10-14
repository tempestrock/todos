import { isRouteErrorResponse, useRouteError, useLocation } from '@remix-run/react'

import Document from '~/components/Document'
import { log } from '~/utils/log'
import { printObject } from '~/utils/printObject'

/**
 * This component is the root Error Boundary of the application.
 *
 * When an error occurs, it will be caught by this component and rendered according its origin.
 * The error is also logged on the server side.
 */
export default function ErrorBoundary() {
  const error = useRouteError()
  const location = useLocation()

  // Log the error on the server side.
  if (typeof window === 'undefined') {
    log(`[ErrorBoundary] path: '${location.pathname}${location.search}'`)
    printObject(error, '[ErrorBoundary]')
  }

  let title = 'Oops!'
  let statusText = ''

  // Check if the error is a caught response.
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      // Custom 404 page
      statusText = 'This page decided to ghost you. But don’t take it personally!'
    } else {
      // Other HTTP errors
      title = `${error.status} ${error.statusText}`
      statusText = `It seems we dropped the ball. Or the server did. Either way, we'll pick it up!`
    }
  } else {
    // Unexpected errors (e.g. exceptions)
    statusText = 'You hit an unexpected edge. Sorry for that!'
  }

  return (
    <Document>
      <main className="container mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        <p className="mb-4">{statusText}</p>
        <p>
          <a href="/" className="text-blue-500 hover:underline">
            Return to the homepage
          </a>
        </p>
      </main>
    </Document>
  )
}
