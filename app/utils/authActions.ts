// app/utils/authActions.ts

import { json, ActionFunction, redirect } from '@remix-run/node'

import { signIn, signOut } from '~/utils/auth'

export type ActionData = {
  success: boolean
  error?: string
  action?: 'signin' | 'signout'
}

export const authAction: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const action = formData.get('action')
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  try {
    switch (action) {
      case 'signin':
        await signIn(username, password)
        return redirect('/')
      case 'signout':
        signOut()
        return redirect('/auth')
      default:
        return json<ActionData>({ success: false, error: 'Invalid action' })
    }
  } catch (error) {
    return json<ActionData>({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    })
  }
}
