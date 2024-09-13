import { Amplify } from 'aws-amplify'
import awsconfig from './aws-exports'

import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react'
import './tailwind.css'

Amplify.configure(awsconfig)

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}
