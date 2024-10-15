import { PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { createSessionStorage } from '@remix-run/node'

import { ENV_PROD } from '~/types/consts'
import { generateSessionId } from '~/utils/auth/utils'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_SESSIONS } from '~/utils/database/dbConsts'
import { log } from '~/utils/log'

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
