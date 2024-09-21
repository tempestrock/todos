import { json, ActionFunction, redirect, ActionFunctionArgs } from '@remix-run/node'

import { signIn, signOut, completeNewPassword } from '~/utils/auth/auth'
import { getSession, commitSession } from '~/utils/auth/session.server'

export type ActionData = {
  success: boolean
  error?: string
  action?: 'signin' | 'signout' | 'completeNewPassword'
}

export const authAction: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const action = formData.get('action')
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  console.log(`[authAction] Handling ${action?.toString()} action`)

  const session = await getSession(request.headers.get('Cookie'))

  try {
    switch (action) {
      case 'signin': {
        const signInResult = await signIn(username, password)
        if (signInResult.challengeName === 'NEW_PASSWORD_REQUIRED') {
          session.set('challengeName', 'NEW_PASSWORD_REQUIRED')
          session.set('username', username)
          session.set('password', password) // Be cautious with storing passwords
          return redirect('/auth', {
            headers: {
              'Set-Cookie': await commitSession(session),
            },
          })
        } else {
          // Successful sign-in
          return redirect('/')
        }
      }

      case 'completeNewPassword': {
        const newPassword = formData.get('newPassword') as string
        const storedUsername = session.get('username')
        const storedPassword = session.get('password')
        if (!storedUsername || !storedPassword) {
          return json<ActionData>({ success: false, error: 'Session expired. Please sign in again.' })
        }
        await completeNewPassword(storedUsername, storedPassword, newPassword)
        // Clear session data
        session.unset('challengeName')
        session.unset('username')
        session.unset('password')
        return redirect('/', {
          headers: {
            'Set-Cookie': await commitSession(session),
          },
        })
      }

      case 'signout':
        console.log('[authAction] About to call signOut')
        signOut()
        session.unset('challengeName')
        session.unset('username')
        session.unset('password')
        console.log('[authAction] signOut completed')
        return redirect('/auth', {
          headers: {
            'Set-Cookie': await commitSession(session),
          },
        })

      default:
        return json<ActionData>({ success: false, error: 'Invalid action' })
    }
  } catch (error) {
    console.error('[authAction]', error)
    return json<ActionData>({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    })
  }
}
