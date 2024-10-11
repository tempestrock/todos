import {
  PutCommand,
  DeleteCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  ScanCommandInput,
} from '@aws-sdk/lib-dynamodb'

import { Task, TaskList, TaskListMetadata, TaskListUndefined } from '~/types/dataTypes'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_TASKLIST_METADATA, TABLE_NAME_TASKS } from '~/utils/database/dbConsts'
import { log } from '~/utils/log'

/**
 * Fetches a task by its unique ID and returns it if found, otherwise returns undefined.
 *
 * @param {string} taskId - The unique ID of the task to fetch.
 * @return {Promise<Task | undefined>} The task if found, otherwise undefined.
 */
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

/**
 * Gets the data of the task list that has the given list ID.
 *
 * @param {string} listId - The unique ID of the task list to load.
 * @return {Promise<TaskList>} The task list with the specified ID.
 */
export async function loadTaskList(listId: string): Promise<TaskList> {
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

    return taskList
  } catch (error) {
    log('[loadTaskList]', error)
    throw error
  }
}

/**
 * Loads the metadata of a task list based on the list ID.
 *
 * @param {string} listId - The unique ID of the task list to load metadata for.
 * @return {Promise<TaskList>} The task list with the specified ID.
 */
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

      if (response.Items) {
        const taskListMetadataReceived = response.Items as TaskListMetadata[]
        const taskListMetadataForGivenListIdReceived = taskListMetadataReceived.find(
          (taskList) => taskList.id === listId
        )

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
    log('[loadMetadataOfTaskList]', error)
    throw error
  }
}

/**
 * Gets the count of tasks that have the specified label ID in their labelIds array.
 *
 * @param {string} labelId - The label ID to search for in tasks.
 * @return {Promise<number>} The count of tasks that have the label ID.
 */
export async function getTaskCountByLabelId(labelId: string): Promise<number> {
  try {
    let taskCount = 0
    let lastEvaluatedKey: Record<string, any> | undefined

    do {
      const scanParams: ScanCommandInput = {
        TableName: getTableName(TABLE_NAME_TASKS),
        ExclusiveStartKey: lastEvaluatedKey,
        FilterExpression: 'contains(labelIds, :labelId)',
        ExpressionAttributeValues: {
          ':labelId': labelId,
        },
        Select: 'COUNT',
      }

      const command = new ScanCommand(scanParams)
      const response = await dbClient().send(command)

      taskCount += response.Count || 0
      lastEvaluatedKey = response.LastEvaluatedKey
    } while (lastEvaluatedKey)

    return taskCount
  } catch (error) {
    log('[getTaskCountByLabelId]', error)
    throw error
  }
}

/**
 * Gets the counts of tasks for multiple label IDs.
 *
 * @param {string[]} labelIds - An array of label IDs to get counts for.
 * @return {Promise<{ [labelId: string]: number }>} An object mapping label IDs to their respective task counts.
 */
export async function getTaskCountsByLabelIds(labelIds: string[]): Promise<{ [labelId: string]: number }> {
  try {
    const labelCounts: { [labelId: string]: number } = {}
    labelIds.forEach((labelId) => (labelCounts[labelId] = 0))
    let lastEvaluatedKey: Record<string, any> | undefined

    do {
      const scanParams = {
        TableName: getTableName(TABLE_NAME_TASKS),
        ExclusiveStartKey: lastEvaluatedKey,
        ProjectionExpression: 'labelIds',
      }

      const command = new ScanCommand(scanParams)
      const response = await dbClient().send(command)

      if (response.Items) {
        const tasks = response.Items as Task[]
        tasks.forEach((task) => {
          if (task.labelIds) {
            task.labelIds.forEach((taskLabelId) => {
              // eslint-disable-next-line no-prototype-builtins
              if (labelCounts.hasOwnProperty(taskLabelId)) {
                labelCounts[taskLabelId] += 1
              }
            })
          }
        })
      }

      lastEvaluatedKey = response.LastEvaluatedKey
    } while (lastEvaluatedKey)

    return labelCounts
  } catch (error) {
    log('[getTaskCountsByLabelIds]', error)
    throw error
  }
}

/**
 * Saves a task to the database. If the task already exists, it will be updated.
 * Otherwise, a new task will be created.
 *
 * @param {Task} task - The task to be saved.
 * @return {Promise<void>} A promise that resolves when the task has been saved.
 */
export async function saveTask(task: Task): Promise<void> {
  try {
    // Check if the task already exists.
    const getParams = {
      TableName: getTableName(TABLE_NAME_TASKS),
      Key: {
        id: task.id,
      },
    }

    const { Item } = await dbClient().send(new GetCommand(getParams))

    if (Item) {
      // The task already exists in the database. => Update it.
      const updateParams = {
        TableName: getTableName(TABLE_NAME_TASKS),
        Key: {
          id: task.id,
        },
        UpdateExpression:
          'set #title = :t, details = :d, boardColumn = :b, #position = :p, updatedAt = :u, labelIds = :l',
        ExpressionAttributeNames: {
          '#title': 'title',
          '#position': 'position',
        },
        ExpressionAttributeValues: {
          ':t': task.title,
          ':d': task.details,
          ':b': task.boardColumn,
          ':p': task.position,
          ':u': task.updatedAt,
          ':l': task.labelIds,
        },
      }

      await dbClient().send(new UpdateCommand(updateParams))
    } else {
      // The task doesn't exist in the database, yet. => Create it.
      const putParams = {
        TableName: getTableName(TABLE_NAME_TASKS),
        Item: task,
      }

      await dbClient().send(new PutCommand(putParams))
    }
  } catch (error) {
    log('[saveTask]', error)
    throw error
  }
}

/**
 * Updates the board column of the given task in the database.
 *
 * @param {Task} task - The task object with the updated column.
 * @return {Promise<void>} A promise that resolves when the update is successful.
 * @throws {Error} If the task does not exist in the database.
 */
export async function updateBoardColumn(task: Task): Promise<void> {
  try {
    // Check if the task already exists.
    const getParams = {
      TableName: getTableName(TABLE_NAME_TASKS),
      Key: {
        id: task.id,
      },
    }

    const { Item } = await dbClient().send(new GetCommand(getParams))

    if (!Item) throw new Error(`Could not update column of task '${task.title}' (${task.id}).`)

    const updateParams = {
      TableName: getTableName(TABLE_NAME_TASKS),
      Key: {
        id: task.id,
      },
      UpdateExpression: 'set #position = :p, boardColumn = :b, updatedAt = :u',
      ExpressionAttributeNames: {
        '#position': 'position',
      },
      ExpressionAttributeValues: {
        ':b': task.boardColumn,
        ':p': task.position,
        ':u': task.updatedAt,
      },
    }

    await dbClient().send(new UpdateCommand(updateParams))
  } catch (error) {
    log('[updateColumn]', error)
    throw error
  }
}

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
