import { PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { Task } from '~/types/dataTypes'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_TASKS } from '~/utils/database/dbConsts'
import { log } from '~/utils/log'

/**
 * Saves a task to the database. If the task already exists, it will be updated.
 * Otherwise, a new task will be created.
 *
 * @param {string} listId - The ID of the list the task belongs to.
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
      log('[saveTask] Task exists. => Updating it.')

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
      log('[saveTask] Task updated successfully.')
    } else {
      // The task doesn't exist in the database, yet. => Create it.
      log('[saveTask] Task is new. => Creating it.')

      const putParams = {
        TableName: getTableName(TABLE_NAME_TASKS),
        Item: task,
      }

      await dbClient().send(new PutCommand(putParams))
      log('[saveTask] Task created successfully.')
    }
  } catch (error) {
    log('[saveTask]', error)
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

    log('[updateColumn] Task exists. => Updating it.')

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
    log('[updateColumn] Updated successfully.')
  } catch (error) {
    log('[updateColumn]', error)
    throw error
  }
}
