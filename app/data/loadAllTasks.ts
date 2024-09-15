import { ScanCommand } from '@aws-sdk/lib-dynamodb'

import { dbClient } from './dbClient'
import { getCurrentEnvName, getTableName, TABLE_NAME_TASKLIST_METADATA, TABLE_NAME_TASKS } from './dbConsts'
import { Task, TaskList, TaskListMetadata } from '~/types/dataTypes'
import { printObject } from '~/utils/printObject'

export async function loadAllTasks(): Promise<TaskList[]> {

  console.log(`-----------Loading all data (${getCurrentEnvName()})-------------`)

  // Read the metadata of all task lists first.
  // This defines their list IDs and names but has no tasks.
  const taskLists = await loadEmptyTaskLists()

  // Read all tasks from a second table.
  let lastEvaluatedKey: Record<string, any> | undefined

  try {
    do {
      const scanParams = {
        TableName: getTableName(TABLE_NAME_TASKS),
        ExclusiveStartKey: lastEvaluatedKey,
      }

      const command = new ScanCommand(scanParams)
      const response = await dbClient().send(command)

      if (response.Items) {
        const tasksReceived = response.Items as Task[]

        // Assign each task to its list.
        tasksReceived.forEach((task) => {
          const list = taskLists.find((list) => list.id === task.listId)
          if (list) list.tasks.push(task)
        })
      }

      lastEvaluatedKey = response.LastEvaluatedKey
    } while (lastEvaluatedKey)

    printObject(taskLists, 'taskLists')

    return taskLists
  } catch (error) {
    console.error('Error in loadAllTasks:', error)
    throw error
  }
}

async function loadEmptyTaskLists(): Promise<TaskList[]> {
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
    console.error('Error in loadTaskListMetadata:', error)
    throw error
  }
}
