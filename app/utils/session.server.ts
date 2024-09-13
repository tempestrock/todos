import { redirect } from '@remix-run/node'

import { getCurrentUser } from './auth'

export async function requireAuth(_request: Request) {
  try {
    const user = await getCurrentUser()
    return user
  } catch (_error: any) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect('/auth')
  }
}
