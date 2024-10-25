import { GetCommand } from '@aws-sdk/lib-dynamodb'

import { User } from '~/types/dataTypes'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_USERS } from '~/utils/database/dbConsts'
import { log } from '~/utils/log'

/**
 * Loads the data for the user with the given ID.
 *
 * @param {string} userId - The ID of the user to load.
 * @return {Promise<User>} The user's data.
 */
export const loadUser = async (userId: string): Promise<User | undefined> => {
  try {
    const getParams = {
      TableName: getTableName(TABLE_NAME_USERS),
      Key: {
        id: userId,
      },
    }

    const command = new GetCommand(getParams)
    const response = await dbClient().send(command)

    if (!response.Item) {
      log(`[loadUser] User with id ${userId} not found.`)
      return undefined
    }

    return response.Item as User
  } catch (error) {
    log('[loadUser]', error)
    throw error
  }
}
