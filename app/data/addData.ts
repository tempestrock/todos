import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

// Configure the DynamoDB client using environment variables
const client = new DynamoDBClient({
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
})

const docClient = DynamoDBDocumentClient.from(client)

// Define your table name
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'Tasks'

interface Task {
  id: string
  task: string
  createdAt: string
  status: string
  listId: string
}

export async function addOrEditTask(listId: string, task: Task): Promise<void> {
  try {
    // const response = await client.send(new ListTablesCommand({}))
    // console.log(response)
    // return

    // Check if the task already exists
    const getParams = {
      TableName: TABLE_NAME,
      Key: {
        listId,
        id: task.id,
      },
    }

    console.log(`[addOrEditTask] Region: ${process.env.AWS_REGION}`)
    console.log('[addOrEditTask] Checking if task exists.')
    const { Item } = await docClient.send(new GetCommand(getParams))

    if (Item) {
      console.log('[addOrEditTask] Task exists.')
      // Task exists, update it
      const updateParams = {
        TableName: TABLE_NAME,
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
          ':t': task.task,
          ':s': task.status,
          ':u': new Date().toISOString(),
        },
      }

      await docClient.send(new UpdateCommand(updateParams))
      console.log('Task updated successfully')
    } else {
      console.log('[addOrEditTask] Task is new.')
      // Task doesn't exist, add it
      const putParams = {
        TableName: TABLE_NAME,
        Item: task, // The task object already includes listId
      }

      await docClient.send(new PutCommand(putParams))
      console.log('Task added successfully')
    }
  } catch (error) {
    console.error('Error in addOrEditTask:', error)
    throw error
  }
}
