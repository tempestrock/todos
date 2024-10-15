import { redirect } from '@remix-run/node'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { JwtExpiredError } from 'aws-jwt-verify/error'

import { refreshTokens } from '~/utils/auth/auth'
import { commitSession, destroySession, getSession } from '~/utils/auth/sessionStorage'
import { log } from '~/utils/log'

/**
 * Ensures that the user is authenticated and provides the user's username and headers for updating the session.
 * If the user is not authenticated, redirects to the '/auth' route.
 * If the access token is expired, attempts to refresh it using the refresh token.
 * If the refresh token is not available, redirects to the '/auth' route.
 * If the token verification fails, redirects to the '/auth' route.
 *
 * @param {Request} request - The request object.
 * @param {string} [path] - The path to be logged if the user is not authenticated.
 * @return {Promise<{ username: string, headers?: HeadersInit }>}
 */
export const requireAuth = async (
  request: Request,
  path?: string
): Promise<{ username: string; headers?: HeadersInit }> => {
  // if (isDevEnv()) return USER_DEV // allow dev environment without login

  const session = await getSession(request.headers.get('Cookie'))
  const accessToken = session.get('accessToken')
  const refreshToken = session.get('refreshToken')

  if (!accessToken) {
    // Log the attempt to access a page without authentication as this could be a malicious attempt.
    if (path) log(`[requireAuth] Path without auth: '${path}'`)
    throw redirect('/auth')
  }

  const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID!,
    tokenUse: 'access',
    clientId: process.env.COGNITO_CLIENT_ID!,
  })

  try {
    const payload = await verifier.verify(accessToken)
    return { username: payload.username }
  } catch (err: any) {
    // If the error is due to expired token, try to refresh tokens.
    if (err instanceof JwtExpiredError) {
      log('[requireAuth] Access token expired, attempting to refresh tokens.')

      if (refreshToken) {
        try {
          const result = await refreshTokens(refreshToken)

          if (result.AuthenticationResult) {
            // Update session with new tokens.
            session.set('accessToken', result.AuthenticationResult.AccessToken)
            session.set('idToken', result.AuthenticationResult.IdToken)

            // Only update refresh token if a new one is provided.
            if (result.AuthenticationResult.RefreshToken) {
              session.set('refreshToken', result.AuthenticationResult.RefreshToken)
            }

            // Commit the session to persist changes.
            const setCookieHeader = await commitSession(session)
            const headers = { 'Set-Cookie': setCookieHeader }

            // Verify the existence of a new access token.
            if (!result.AuthenticationResult.AccessToken) {
              throw new Error('Failed to refresh tokens: No AccessToken in response')
            }

            // Verify the new access token.
            const payload = await verifier.verify(result.AuthenticationResult.AccessToken)
            log(`[requireAuth] Successfully refreshed access token of user '${payload.username}'.`)

            return { username: payload.username, headers }
          } else {
            throw new Error('Failed to refresh tokens: No AuthenticationResult in response')
          }
        } catch (refreshError) {
          log('[requireAuth] Failed to refresh tokens:', refreshError)
          // Destroy the session and redirect to '/auth'
          throw redirect('/auth', {
            headers: {
              'Set-Cookie': await destroySession(session),
            },
          })
        }
      } else {
        log('[requireAuth] No refresh token available to refresh access token.')
        throw redirect('/auth', {
          headers: {
            'Set-Cookie': await destroySession(session),
          },
        })
      }
    } else {
      log('[requireAuth] Token verification failed:', err)
      throw redirect('/auth', {
        headers: {
          'Set-Cookie': await destroySession(session),
        },
      })
    }
  }
}
