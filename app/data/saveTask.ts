import { PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { dbClient } from './dbClient'
import { getTableName, TABLE_NAME_TASKS } from './dbConsts'
import { Task } from '~/types/dataTypes'

export async function saveTask(listId: string, task: Task): Promise<void> {
  try {
    // Check if the task already exists
    const getParams = {
      TableName: getTableName(TABLE_NAME_TASKS),
      Key: {
        listId,
        id: task.id,
      },
    }

    const { Item } = await dbClient().send(new GetCommand(getParams))

    if (Item) {
      console.log('[saveTask] Task exists.')
      // Task exists, update it
      const updateParams = {
        TableName: getTableName(TABLE_NAME_TASKS),
        Key: {
          listId: listId,
          id: task.id,
        },
        UpdateExpression: 'set #title = :t, #status = :s, updatedAt = :u',
        ExpressionAttributeNames: {
          '#title': 'title',
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':t': task.title,
          ':s': task.status,
          ':u': new Date().toISOString(),
        },
      }

      await dbClient().send(new UpdateCommand(updateParams))
      console.log('[saveTask] Task updated successfully')
    } else {
      // Task doesn't exist => add it.
      console.log('[saveTask] Task is new.')

      const putParams = {
        TableName: getTableName(TABLE_NAME_TASKS),
        Item: task,
      }

      await dbClient().send(new PutCommand(putParams))
      console.log('[saveTask] Task added successfully')
    }
  } catch (error) {
    console.error('[saveTask]', error)
    throw error
  }
}
