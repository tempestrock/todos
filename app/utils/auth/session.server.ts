import { redirect, createCookieSessionStorage } from '@remix-run/node'

import { getCurrentUser } from '~/utils/auth/auth'

export const requireAuth = async (_request: Request): Promise<string> => {
  try {
    const user = await getCurrentUser()
    return user.cognitoUser.username
  } catch (_error: any) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect('/auth')
  }
}

// Necessary for the handling of 'new password required'.
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [process.env.SESSION_SECRET!],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
  },
})

export const { getSession, commitSession, destroySession } = sessionStorage
