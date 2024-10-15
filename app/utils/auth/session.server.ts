import { PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { createSessionStorage, redirect } from '@remix-run/node'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { JwtExpiredError } from 'aws-jwt-verify/error'

import { refreshTokens } from './auth'
import { ENV_PROD } from '~/types/consts'
import { generateSessionId } from '~/utils/auth/utils'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_SESSIONS } from '~/utils/database/dbConsts'
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

/**
 * Create a session storage system using the custom logic to store sessions in AWS DynamoDB.
 */
const sessionStorage = createSessionStorage({
  cookie: {
    name: 'session',
    secure: process.env.NODE_ENV === ENV_PROD ? true : false,
    secrets: [process.env.SESSION_SECRET!],
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },

  /**
   * Creates a new session entry in DynamoDB.
   *
   * @param {object} data - The data to store in the session.
   * @param {Date | undefined} expires - The time at which the session should expire.
   * If not specified, the session will not expire.
   * @return {Promise<string>} The ID of the new session.
   */
  async createData(data: object, expires: Date | undefined): Promise<string> {
    const id = generateSessionId()
    const ttl = expires ? Math.floor(expires.getTime() / 1000) : undefined

    await dbClient().send(
      new PutCommand({
        TableName: getTableName(TABLE_NAME_SESSIONS),
        Item: {
          id,
          data: JSON.stringify(data),
          ...(ttl && { expiresAt: ttl }),
        },
      })
    )

    return id
  },

  /**
   * Reads a session from DynamoDB.
   *
   * @param {string} id - The ID of the session to read.
   * @return {Promise<object | null>} The session data as an object, or null if the session does not exist.
   */
  async readData(id: string): Promise<object | null> {
    if (!id) {
      log('[readData] No session ID provided.')
      return null
    }

    const result = await dbClient().send(
      new GetCommand({
        TableName: getTableName(TABLE_NAME_SESSIONS),
        Key: { id },
      })
    )

    if (!result.Item) return null

    return JSON.parse(result.Item.data)
  },

  /**
   * Updates the session data with the given id. If the session does not exist,
   * this method does nothing.
   *
   * @param {string} id - The ID of the session to be updated.
   * @param {object} data - The new session data.
   * @param {Date | undefined} expires - If specified, the session will expire
   *   at this time. If not specified, the existing session expiration time will
   *   be preserved.
   */
  async updateData(id: string, data: object, expires: Date | undefined) {
    const ttl = expires ? Math.floor(expires.getTime() / 1000) : undefined

    await dbClient().send(
      new PutCommand({
        TableName: getTableName(TABLE_NAME_SESSIONS),
        Item: {
          id,
          data: JSON.stringify(data),
          ...(ttl && { expiresAt: ttl }),
        },
      })
    )
  },

  /**
   * Deletes a session from DynamoDB.
   *
   * @param {string} id - The ID of the session to delete.
   */
  async deleteData(id: string) {
    await dbClient().send(
      new DeleteCommand({
        TableName: getTableName(TABLE_NAME_SESSIONS),
        Key: { id },
      })
    )
  },
})

export const { getSession, commitSession, destroySession } = sessionStorage
