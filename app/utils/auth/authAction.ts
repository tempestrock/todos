import { ActionFunction, ActionFunctionArgs, json, redirect } from '@remix-run/node'

import { signIn, completeNewPassword } from '~/utils/auth/auth'
import { getSession, commitSession, destroySession } from '~/utils/auth/session.server'

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

  const session = await getSession(request.headers.get('Cookie'))

  try {
    switch (action) {
      case 'signin': {
        const result = await signIn(username, password)

        if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
          session.set('challengeName', result.ChallengeName)
          session.set('sessionToken', result.Session)
          session.set('username', username)

          return redirect('/auth', {
            headers: {
              'Set-Cookie': await commitSession(session),
            },
          })
        } else if (result.AuthenticationResult) {
          session.set('accessToken', result.AuthenticationResult.AccessToken)
          session.set('idToken', result.AuthenticationResult.IdToken)
          session.set('refreshToken', result.AuthenticationResult.RefreshToken)

          return redirect('/', {
            headers: {
              'Set-Cookie': await commitSession(session),
            },
          })
        } else {
          throw new Error('Unexpected response from Cognito')
        }
      }

      case 'completeNewPassword': {
        const newPassword = formData.get('newPassword') as string
        const storedUsername = session.get('username')
        const sessionToken = session.get('sessionToken')

        if (!storedUsername || !sessionToken) {
          return json<ActionData>({ success: false, error: 'Session expired. Please sign in again.' })
        }

        const result = await completeNewPassword(storedUsername, newPassword, sessionToken)

        if (result.AuthenticationResult) {
          session.set('accessToken', result.AuthenticationResult.AccessToken)
          session.set('idToken', result.AuthenticationResult.IdToken)
          session.set('refreshToken', result.AuthenticationResult.RefreshToken)

          // Clear challenge data from session
          session.unset('challengeName')
          session.unset('sessionToken')
          session.unset('username')

          return redirect('/', {
            headers: {
              'Set-Cookie': await commitSession(session),
            },
          })
        } else {
          throw new Error('Unexpected response from Cognito')
        }
      }

      case 'signout':
        await destroySession(session)
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
