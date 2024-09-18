import { ScanCommand } from '@aws-sdk/lib-dynamodb'

import { dbClient } from './dbClient'
import { getCurrentEnvName, getTableName, TABLE_NAME_TASKLIST_METADATA, TABLE_NAME_TASKS } from './dbConsts'
import { Task, TaskList, TaskListMetadata, TaskListUndefined } from '~/types/dataTypes'
import { printObject } from '~/utils/printObject'

export async function loadTask(listId: string, taskId: string): Promise<Task | undefined> {
  console.log(`----------- loadTask(${listId}, ${taskId}) (${getCurrentEnvName()})-------------`)

  // Get the metadata of the one task list that has the given list ID.
  const taskList = await loadMetadataOfTaskList(listId)

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

        // Assign those tasks to the list that have the correct list ID.
        tasksReceived.forEach((task) => {
          if (task.listId === listId) taskList.tasks.push(task)
        })
      }

      lastEvaluatedKey = response.LastEvaluatedKey
    } while (lastEvaluatedKey)

    // printObject(taskList, '[loadTask] taskList')

    const task = taskList.tasks.find((task) => task.id === taskId)
    printObject(task, '[loadTask] task')

    return task
  } catch (error) {
    console.error('[loadTask]', error)
    throw error
  }
}

async function loadMetadataOfTaskList(listId: string): Promise<TaskList> {
  let taskList: TaskList = TaskListUndefined
  let lastEvaluatedKey: Record<string, any> | undefined

  try {
    do {
      const scanParams = {
        TableName: getTableName(TABLE_NAME_TASKLIST_METADATA),
        ExclusiveStartKey: lastEvaluatedKey,
      }

      const command = new ScanCommand(scanParams)
      const response = await dbClient().send(command)

      // printObject(response.Items, '[loadMetadataOfTaskList] response.Items')

      if (response.Items) {
        const taskListMetadataReceived = response.Items as TaskListMetadata[]
        const taskListMetadataForGivenListIdReceived = taskListMetadataReceived.find(
          (taskList) => taskList.id === listId
        )

        // printObject(taskListMetadataForGivenListIdReceived, '[loadMetadataOfTaskList] taskListMetadataForGivenListIdReceived')

        if (taskListMetadataForGivenListIdReceived)
          // We found the metadata for the given list ID.
          // Take the metadata and convert it to a task list by
          // adding an empty task array.
          taskList = {
            ...taskListMetadataForGivenListIdReceived,
            tasks: [],
          }
      }

      lastEvaluatedKey = response.LastEvaluatedKey
    } while (lastEvaluatedKey)

    return taskList
  } catch (error) {
    console.error('[loadMetadataOfTaskList]', error)
    throw error
  }
}
