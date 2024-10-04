import { DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb'

import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_TASKS } from '~/utils/database/dbConsts'
import { log } from '~/utils/log'

/**
 * Deletes a task from the database.
 *
 * @param {string} listId - The ID of the list the task belongs to.
 * @param {string} taskId - The ID of the task to be deleted.
 * @return {Promise<void>} A promise that resolves when the task has been deleted.
 * @throws {Error} If the task does not exist in the database.
 */
export async function deleteTask(listId: string, taskId: string): Promise<void> {
  try {
    // Check if the task exists.
    const getParams = {
      TableName: getTableName(TABLE_NAME_TASKS),
      Key: {
        id: taskId,
      },
    }

    const { Item } = await dbClient().send(new GetCommand(getParams))

    if (!Item) {
      throw new Error(`Task with ID ${taskId} in list ${listId} does not exist.`)
    }

    const deleteParams = {
      TableName: getTableName(TABLE_NAME_TASKS),
      Key: {
        id: taskId,
      },
    }

    await dbClient().send(new DeleteCommand(deleteParams))
  } catch (error) {
    log('[deleteTask]', error)
    throw error
  }
}
