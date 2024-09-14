import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'

import { Task, TodoList } from '~/types/tasks'

// Reuse the DynamoDB client setup from the previous function
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
})

const docClient = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'Tasks'

export async function loadAllTasks(): Promise<TodoList[]> {
  const allTasks: Task[] = []
  let lastEvaluatedKey: Record<string, any> | undefined

  try {
    do {
      const scanParams = {
        TableName: TABLE_NAME,
        ExclusiveStartKey: lastEvaluatedKey,
      }

      const command = new ScanCommand(scanParams)
      const response = await docClient.send(command)

      if (response.Items) {
        allTasks.push(...(response.Items as Task[]))
      }

      lastEvaluatedKey = response.LastEvaluatedKey
    } while (lastEvaluatedKey)

    // Group tasks by listId
    const tasksByList: Record<string, Task[]> = {}
    allTasks.forEach((task) => {
      if (!tasksByList[task.listId]) {
        tasksByList[task.listId] = []
      }
      tasksByList[task.listId].push(task)
    })

    // Convert to TodoList array
    // Note: You may need to fetch list names separately if they're not part of the tasks table
    const todoLists: TodoList[] = Object.entries(tasksByList).map(([listId, tasks]) => ({
      id: listId,
      name: `List ${listId}`, // Placeholder: replace with actual list name if available
      color: 'blue',
      tasks: tasks,
    }))

    return todoLists
  } catch (error) {
    console.error('Error in loadAllTasks:', error)
    throw error
  }
}
