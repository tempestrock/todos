// app/utils/authActions.ts

import { json, ActionFunction, redirect, ActionFunctionArgs } from '@remix-run/node'

import { disableUser } from './session.server'
import { signIn, signOut } from '~/utils/auth'

export type ActionData = {
  success: boolean
  error?: string
  action?: 'signin' | 'signout'
}

export const authAction: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const action = formData.get('action')
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`[authAction]: Handling ${action} action`)

  try {
    switch (action) {
      case 'signin':
        await signIn(username, password)
        return redirect('/')

      case 'signout':
        console.log('[authAction]: About to call signOut')
        signOut()
        disableUser()
        console.log('[authAction]: signOut completed')
        return redirect('/auth')

      default:
        return json<ActionData>({ success: false, error: 'Invalid action' })
    }
  } catch (error) {
    console.error('[authAction]: Error occurred', error)
    return json<ActionData>({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    })
  }
}