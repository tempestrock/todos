import { ActionFunction, ActionFunctionArgs, json, redirect } from '@remix-run/node'

import { signIn, completeNewPassword } from '~/utils/auth/auth'
import { getSession, commitSession, destroySession } from '~/utils/auth/sessionStorage'
import { log } from '~/utils/log'
import { printObject } from '~/utils/printObject'

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
        return redirect('/auth', {
          headers: {
            'Set-Cookie': await destroySession(session),
          },
        })

      default:
        return json<ActionData>({ success: false, error: 'Invalid action' })
    }
  } catch (error: any) {
    switch (error.name) {
      case 'NotAuthorizedException':
        log(`[authAction] Failed login attempt with existing user '${username}' and wrong password '${password}'.`)
        return json<ActionData>({ success: false, error: 'Incorrect username or password.' })

      case 'UserNotFoundException':
        log(`[authAction] Failed login attempt with unknown user '${username}' and password '${password}'.`)
        return json<ActionData>({ success: false, error: 'Incorrect username or password.' })

      default:
        printObject(error, '[authAction] exception')
        log('[authAction] An unexpected error occurred:', error)
        return json<ActionData>({ success: false, error: `An unexpected error occurred: ${error.name}` })
    }
  }
}
