import { GetCommand } from '@aws-sdk/lib-dynamodb'

import { Task } from '~/types/dataTypes'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_TASKS } from '~/utils/database/dbConsts'
import { log } from '~/utils/log'

export async function loadTask(taskId: string): Promise<Task | undefined> {
  try {
    // Fetch the task directly by its unique ID
    const getParams = {
      TableName: getTableName(TABLE_NAME_TASKS),
      Key: {
        id: taskId,
      },
    }

    const command = new GetCommand(getParams)
    const response = await dbClient().send(command)

    const task = response.Item as Task | undefined

    // Verify that the task exists and belongs to the specified listId
    if (task) {
      return task
    } else {
      log(`Task with id ${taskId} not found.`)
      return undefined
    }
  } catch (error) {
    log('[loadTask]', error)
    throw error
  }
}
