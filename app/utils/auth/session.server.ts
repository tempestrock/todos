/* eslint-disable @typescript-eslint/only-throw-error */
import { redirect, createCookieSessionStorage } from '@remix-run/node'
import { CognitoJwtVerifier } from 'aws-jwt-verify'

export const requireAuth = async (request: Request): Promise<string> => {
  const session = await getSession(request.headers.get('Cookie'))
  const accessToken = session.get('accessToken')

  if (!accessToken) {
    throw redirect('/auth')
  }

  const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID!,
    tokenUse: 'access',
    clientId: process.env.COGNITO_CLIENT_ID!,
  })

  try {
    const payload = await verifier.verify(accessToken)
    return payload.username
  } catch (_err) {
    // Token is invalid or expired
    throw redirect('/auth')
  }
}

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
