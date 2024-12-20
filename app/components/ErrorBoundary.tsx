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
  const error = useRouteError() as Error
  const location = useLocation()

  let title = 'Oops!'
  let statusText = ''

  // Check if the error is a caught response.
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      // Custom 404 page
      statusText = 'This page decided to ghost you. But don’t take it personally!'

      if (typeof window === 'undefined') log(`[ErrorBoundary] 404 for path '${location.pathname}${location.search}'`)
    } else {
      // Other HTTP errors
      title = `${error.status} ${error.statusText}`
      statusText = `It seems we dropped the ball. Or the server did. Either way, we'll pick it up!`

      if (typeof window === 'undefined') {
        log(`[ErrorBoundary] Path: '${location.pathname}${location.search}'`)
        printObject(error, '[ErrorBoundary]')
      }
    }
  } else {
    // Unexpected errors (e.g. exceptions).
    if (
      error.stack &&
      (error.stack.includes('Resolved credential object is not valid') ||
        error.stack.includes('The security token included in the request is expired'))
    ) {
      // Very likely AWS credentials are missing or not valid (anymore).
      statusText = 'The AWS credentials you use when starting the service are not valid. Please double check.'
      printObject(error, '[ErrorBoundary]')
    } else {
      // Last resort.
      statusText = 'You hit an unexpected edge. Sorry for that!'
      printObject(error, '[ErrorBoundary]')
    }
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
