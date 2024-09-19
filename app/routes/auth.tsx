import { json, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
import { useActionData, Form, redirect, useLoaderData } from '@remix-run/react'
import { useEffect, useRef } from 'react'

import { User } from '~/types/dataTypes'
import { getCurrentUser } from '~/utils/auth'
import { authAction, ActionData } from '~/utils/authAction'
import { printObject } from '~/utils/printObject'

/**
 * Displays the authentication page.
 */

export type LoaderData = {
  user: User
  success: boolean
}

export const loader: LoaderFunction = async ({ params }: LoaderFunctionArgs) => {
  console.log('[auth.loader] starting')
  printObject(params, '[auth.loader] params')

  try {
    const user = await getCurrentUser()
    if (user) {
      // If the user is authenticated, redirect to the home page.
      return redirect('/')
    }
    return json({ success: true, user: null })
  } catch {
    return json({ success: false, user: null })
  }
}

export const action = authAction

export default function Auth() {
  const actionData = useActionData<ActionData>()
  const loaderData = useLoaderData()

  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (usernameInputRef.current) {
      usernameInputRef.current.focus()
    }
  }, [loaderData])

  return (
    <div>
      <h1 className="text-3xl text-gray-800 flex justify-center mt-8 mb-4">Todos</h1>

      <div>
        <h2 className="flex justify-center text-xl my-4">Please login first.</h2>
        <div className="mx-auto flex justify-center">
          <Form method="post" className="w-64">
            <input type="hidden" name="action" value="signin" />
            <div className="flex flex-col items-start">
              <input
                ref={usernameInputRef}
                type="text"
                name="username"
                className="my-2 text-gray-800 w-full p-2 border border-gray-300 rounded"
                placeholder="Username"
                required
              />
              <input
                type="password"
                name="password"
                className="my-2 text-gray-800 w-full p-2 border border-gray-300 rounded"
                placeholder="Password"
                required
              />
              <button className="text-xs border border-gray-700 mt-6 bg-gray-100 px-4 py-2 rounded" type="submit">
                Sign In
              </button>
            </div>
          </Form>
        </div>{' '}
      </div>
      {actionData?.error && <p>Error: {actionData.error}</p>}
    </div>
  )
}
