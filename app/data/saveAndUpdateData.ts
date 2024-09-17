import { PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { dbClient } from './dbClient'
import { getTableName, TABLE_NAME_TASKS } from './dbConsts'
import { Task } from '~/types/dataTypes'

/**
 * Saves a task to the database. If the task already exists, it will be updated.
 * Otherwise, a new task will be created.
 *
 * @param {string} listId - The ID of the list the task belongs to.
 * @param {Task} task - The task to be saved.
 * @return {Promise<void>} A promise that resolves when the task has been saved.
 */
export async function saveTask(listId: string, task: Task): Promise<void> {
  try {
    // Check if the task already exists.
    const getParams = {
      TableName: getTableName(TABLE_NAME_TASKS),
      Key: {
        listId,
        id: task.id,
      },
    }

    const { Item } = await dbClient().send(new GetCommand(getParams))

    if (Item) {
      // The task already exists in the database. => Update it.
      console.log('[saveTask] Task exists. => Updating it.')

      const updateParams = {
        TableName: getTableName(TABLE_NAME_TASKS),
        Key: {
          listId: listId,
          id: task.id,
        },
        UpdateExpression: 'set #title = :t, boardColumn = :b, updatedAt = :u',
        ExpressionAttributeNames: {
          '#title': 'title',
        },
        ExpressionAttributeValues: {
          ':t': task.title,
          ':b': task.boardColumn,
          ':u': task.updatedAt,
        },
      }

      await dbClient().send(new UpdateCommand(updateParams))
      console.log('[saveTask] Task updated successfully.')
    } else {
      // The task doesn't exist in the database, yet. => Create it.
      console.log('[saveTask] Task is new. => Creating it.')

      const putParams = {
        TableName: getTableName(TABLE_NAME_TASKS),
        Item: task,
      }

      await dbClient().send(new PutCommand(putParams))
      console.log('[saveTask] Task created successfully.')
    }
  } catch (error) {
    console.error('[saveTask]', error)
    throw error
  }
}

/**
 * Updates the board column of the given task in the database.
 *
 * @param {string} listId - The ID of the task list.
 * @param {Task} task - The task object with the updated column.
 * @return {Promise<void>} A promise that resolves when the update is successful.
 * @throws {Error} If the task does not exist in the database.
 */
export async function updateColumn(listId: string, task: Task): Promise<void> {
  try {
    // Check if the task already exists.
    const getParams = {
      TableName: getTableName(TABLE_NAME_TASKS),
      Key: {
        listId,
        id: task.id,
      },
    }

    const { Item } = await dbClient().send(new GetCommand(getParams))

    if (!Item) throw new Error(`Could not update column of task '${task.title}' (${task.id}).`)

    console.log('[updateColumn] Task exists. => Updating it.')

    const updateParams = {
      TableName: getTableName(TABLE_NAME_TASKS),
      Key: {
        listId: listId,
        id: task.id,
      },
      UpdateExpression: 'set boardColumn = :b, updatedAt = :u',
      ExpressionAttributeValues: {
        ':b': task.boardColumn,
        ':u': task.updatedAt,
      },
    }

    await dbClient().send(new UpdateCommand(updateParams))
    console.log('[updateColumn] Updated successfully.')
  } catch (error) {
    console.error('[updateColumn]', error)
    throw error
  }
}
