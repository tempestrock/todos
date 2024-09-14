import { ScanCommand } from '@aws-sdk/lib-dynamodb'

import { dbClient } from './dbClient'
import { TABLE_NAME_TASKLISTS } from './dbConsts'
import { TodoList } from '~/types/tasks'
import { printObject } from '~/utils/printObject'

export async function loadAllTaskLists(): Promise<TodoList[]> {
  const allTaskLists: TodoList[] = []
  let lastEvaluatedKey: Record<string, any> | undefined

  try {
    do {
      const scanParams = {
        TableName: TABLE_NAME_TASKLISTS,
        ExclusiveStartKey: lastEvaluatedKey,
      }

      const command = new ScanCommand(scanParams)
      const response = await dbClient().send(command)

      if (response.Items) {
        allTaskLists.push(...(response.Items as TodoList[]))
      }

      lastEvaluatedKey = response.LastEvaluatedKey
    } while (lastEvaluatedKey)

    printObject(allTaskLists, 'allTaskLists')

    return allTaskLists
  } catch (error) {
    console.error('Error in loadAllTasks:', error)
    throw error
  }
}
