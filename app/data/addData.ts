import { PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { dbClient } from './dbClient'
import { getTableName, TABLE_NAME_TASKS } from './dbConsts'
import { Task } from '~/types/dataTypes'

export async function addOrEditTask(listId: string, task: Task): Promise<void> {
  try {
    // const response = await client.send(new ListTablesCommand({}))
    // console.log(response)
    // return

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
      console.log('[addOrEditTask] Task exists.')
      // Task exists, update it
      const updateParams = {
        TableName: getTableName(TABLE_NAME_TASKS),
        Key: {
          listId: listId,
          id: task.id,
        },
        UpdateExpression: 'set #task = :t, #status = :s, updatedAt = :u',
        ExpressionAttributeNames: {
          '#task': 'task',
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':t': task.title,
          ':s': task.status,
          ':u': new Date().toISOString(),
        },
      }

      await dbClient().send(new UpdateCommand(updateParams))
      console.log('[addOrEditTask] Task updated successfully')
    } else {
      console.log('[addOrEditTask] Task is new.')
      // Task doesn't exist => add it.
      const putParams = {
        TableName: getTableName(TABLE_NAME_TASKS),
        Item: task,
      }

      await dbClient().send(new PutCommand(putParams))
      console.log('[addOrEditTask] Task added successfully')
    }
  } catch (error) {
    console.error('Error in addOrEditTask:', error)
    throw error
  }
}
