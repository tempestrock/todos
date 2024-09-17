import { redirect } from '@remix-run/node'

import { getCurrentUser } from './auth'

let user: any | undefined

export async function requireAuth(_request: Request) {
  try {
    if (!user) {
      console.log('[requireAuth] getting new user')
      user = await getCurrentUser()
    } else {
      console.log('[requireAuth] user exists')
    }

    return user
  } catch (_error: any) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect('/auth')
  }
}
