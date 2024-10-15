import { json, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
import { useActionData, Form, redirect, useLoaderData, useNavigation } from '@remix-run/react'
import { useEffect, useRef } from 'react'

import Spinner from '~/components/Spinner'
import { useTranslation } from '~/contexts/TranslationContext'
import { User } from '~/types/dataTypes'
import { authAction, ActionData } from '~/utils/auth/authAction'
import { requireAuth } from '~/utils/auth/requireAuth'
import { getSession } from '~/utils/auth/sessionStorage'

/**
 * Displays the authentication page and allows the user to enter username and password.
 */

export type LoaderData = {
  user: User
  success: boolean
  challengeName?: string
}

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get('Cookie'))
  const challengeName = session.get('challengeName')

  if (challengeName === 'NEW_PASSWORD_REQUIRED') {
    return json({ success: true, challengeName: 'NEW_PASSWORD_REQUIRED' })
  } else {
    try {
      await requireAuth(request)
      return redirect('/')
    } catch {
      return json({ success: false })
    }
  }
}

export const action = authAction

export default function Auth() {
  const { challengeName } = useLoaderData<LoaderData>()
  const actionData = useActionData<ActionData>()
  const navigation = useNavigation()
  const usernameInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()

  useEffect(() => {
    // Directly put the cursor into the username field.
    if (usernameInputRef.current) {
      usernameInputRef.current.focus()
    }
  }, [])

  if (challengeName === 'NEW_PASSWORD_REQUIRED') {
    // Show the new password form.
    return (
      <div>
        <h1 className="text-3xl text-gray-900 dark:text-gray-100 flex justify-center mt-8 mb-4">Todos</h1>
        <div>
          <h2 className="flex justify-center text-xl text-gray-900 dark:text-gray-100 my-4">{`${t['set-new-password']}`}</h2>

          <div className="mx-auto flex justify-center">
            <Form method="post" className="w-64" autoComplete="off">
              <input type="hidden" name="action" value="completeNewPassword" />
              {/* This hidden field is just to prefent browsers from crazy autofilling the password field. */}
              <input type="text" name="username" autoComplete="username" value="" style={{ display: 'none' }} />
              <div className="flex flex-col items-start">
                <input
                  type="password"
                  name="newPassword"
                  autoComplete="off"
                  className="my-2 w-full p-2 border rounded text-blue-800 dark:text-gray-100 border-blue-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  placeholder={t['new-password']}
                  required
                />
                <button
                  className="text-base text-blue-500 border border-blue-700 hover:border-blue-900 hover:bg-blue-900 hover:text-white rounded mt-6 pt-1 px-2 pb-1"
                  type="submit"
                >
                  {navigation.state === 'submitting' ? (
                    <Spinner size={24} lightModeColor="text-gray-100" />
                  ) : (
                    t['set-password']
                  )}
                </button>
              </div>
            </Form>
          </div>
          {actionData?.error && (
            <div className="flex justify-center mt-4 text-lg text-gray-900 dark:text-gray-100">
              Error: {actionData.error}
            </div>
          )}
        </div>
      </div>
    )
  } else {
    // Show the sign-in form.
    return (
      <div>
        <h1 className="text-3xl text-gray-900 dark:text-gray-100 flex justify-center mt-8 mb-4">Todos</h1>
        <div>
          <h2 className="flex justify-center text-xl text-gray-900 dark:text-gray-100 my-4">{`${t['sign-in-first']}.`}</h2>
          <div className="mx-auto flex justify-center">
            <Form method="post" className="w-64">
              <input type="hidden" name="action" value="signin" />
              <div className="flex flex-col items-start">
                <input
                  ref={usernameInputRef}
                  type="text"
                  name="username"
                  autoComplete="username"
                  className="my-2 w-full p-2 border rounded text-blue-800 dark:text-gray-100 border-blue-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  placeholder={t['username']}
                  required
                />
                <input
                  type="password"
                  name="password"
                  className="my-2 w-full p-2 border rounded text-blue-800 dark:text-gray-100 border-blue-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                  placeholder={t['password']}
                  required
                />
                <button
                  className="text-base text-blue-500 border border-blue-700 hover:border-blue-900 hover:bg-blue-900 hover:text-white rounded mt-6 pt-1 px-2 pb-1"
                  type="submit"
                >
                  {navigation.state === 'submitting' ? <Spinner size={24} lightModeColor="#2E5CEE" /> : t['sign-in']}
                </button>
              </div>
            </Form>
          </div>
          {actionData?.error && (
            <div className="flex justify-center mt-4 text-lg text-gray-900 dark:text-gray-100">
              Error: {actionData.error}
            </div>
          )}
        </div>
      </div>
    )
  }
}
