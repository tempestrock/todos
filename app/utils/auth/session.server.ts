import { redirect } from '@remix-run/node'

import { getCurrentUser } from '~/utils/auth/auth'

let user: any | undefined

/**
 * Ensures that the user is authenticated before proceeding.
 * Caches the user object for future calls to this function.
 *
 * @param {Request} _request - The incoming request object.
 * @return {Promise<string>} The authenticated user's username.
 */
export const requireAuth = async (_request: Request): Promise<string> => {
  try {
    if (!user) {
      console.log('[requireAuth] getting new user')
      user = await getCurrentUser()
    } else {
      console.log('[requireAuth] user exists')
    }

    return user.cognitoUser.username
  } catch (_error: any) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect('/auth')
  }
}

/**
 * Disables the current user by removing them from the cache.
 *
 * @return {void} No return value.
 */
export const disableUser = (): void => {
  user = undefined
}
