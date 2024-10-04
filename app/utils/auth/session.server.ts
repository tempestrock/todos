/* eslint-disable @typescript-eslint/only-throw-error */
import { PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { createSessionStorage, redirect } from '@remix-run/node'
import { CognitoJwtVerifier } from 'aws-jwt-verify'

import { ENV_PROD, USER_DEV } from '~/types/consts'
import { generateSessionId } from '~/utils/auth/utils'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_SESSIONS } from '~/utils/database/dbConsts'
import { isDevEnv } from '~/utils/isDevEnv'
import { log } from '~/utils/log'

export const requireAuth = async (request: Request): Promise<string> => {
  if (isDevEnv()) return USER_DEV

  const session = await getSession(request.headers.get('Cookie'))
  const accessToken = session.get('accessToken')

  if (!accessToken) {
    console.warn('[requireAuth] No access token found in session.')
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
  } catch (err) {
    log('[requireAuth] Token verification failed:', err)
    throw redirect('/auth')
  }
}

export const sessionStorage = createSessionStorage({
  cookie: {
    name: 'session',
    secure: process.env.NODE_ENV === ENV_PROD ? true : false,
    secrets: [process.env.SESSION_SECRET!],
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },

  async createData(data, expires) {
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

  async readData(id) {
    if (!id) {
      console.warn('[readData] No session ID provided.')
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

  async updateData(id, data, expires) {
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

  async deleteData(id) {
    await dbClient().send(
      new DeleteCommand({
        TableName: getTableName(TABLE_NAME_SESSIONS),
        Key: { id },
      })
    )
  },
})

export const { getSession, commitSession, destroySession } = sessionStorage
