import { ScanCommand } from '@aws-sdk/lib-dynamodb'

import { dbClient } from './dbClient'
import { getTableName, TABLE_NAME_TASKLIST_METADATA } from './dbConsts'
import { TaskList, TaskListMetadata } from '~/types/dataTypes'

/**
 * Loads task list metadata from the database without the actual tasks.
 *
 * @return {TaskList[]} An array of task lists with empty task arrays.
 */
export async function loadListMetadata(): Promise<TaskList[]> {
  const taskLists: TaskList[] = []
  let lastEvaluatedKey: Record<string, any> | undefined

  try {
    do {
      const scanParams = {
        TableName: getTableName(TABLE_NAME_TASKLIST_METADATA),
        ExclusiveStartKey: lastEvaluatedKey,
      }

      const command = new ScanCommand(scanParams)
      const response = await dbClient().send(command)

      if (response.Items) {
        // Take the metadata and convert it to a task list by
        // adding an empty task array.
        const taskListMetadataReceived = response.Items as TaskListMetadata[]
        const taskListsReceived = taskListMetadataReceived.map((taskList) => {
          return {
            tasks: [],
            ...taskList,
          }
        })
        taskLists.push(...taskListsReceived)
      }

      lastEvaluatedKey = response.LastEvaluatedKey
    } while (lastEvaluatedKey)

    return taskLists
  } catch (error) {
    console.error('Error in loadListMetadata:', error)
    throw error
  }
}
