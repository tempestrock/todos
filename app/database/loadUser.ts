import { GetCommand } from '@aws-sdk/lib-dynamodb'

import { dbClient } from './dbClient'
import { getCurrentEnvName, getTableName, TABLE_NAME_USERS } from './dbConsts'
import { User } from '~/types/dataTypes'
import { printObject } from '~/utils/printObject'

/**
 * Loads the data for the user with the given ID.
 *
 * @param {string} userId - The ID of the user to load.
 * @return {Promise<User>} The user's data.
 */
export const loadUser = async (userId: string): Promise<User> => {
  console.log(`----------- loadUser(${userId}) (${getCurrentEnvName()})-------------`)

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
      throw new Error(`User with id ${userId} not found`)
    }

    printObject(response.Item, '[loadUser] response.Item')

    return response.Item as User
  } catch (error) {
    console.error('[loadUser]', error)
    throw error
  }
}
