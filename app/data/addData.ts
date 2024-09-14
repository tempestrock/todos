import AWS from 'aws-sdk'

// Initialize DynamoDB DocumentClient
const dynamoDb = new AWS.DynamoDB.DocumentClient()

// Function to add a new task to DynamoDB
export async function addTask(listId: string, task: { id: string; task: string; createdAt: string; status: string }) {
  const params = {
    TableName: 'TodoLists',
    Item: {
      listId,
      taskId: task.id,
      task: task.task,
      createdAt: task.createdAt,
      status: task.status,
    },
  }

  try {
    console.log('[addTask] Saving task.')

    await dynamoDb.put(params).promise()
    console.log('[addTask] Task added successfully!')
  } catch (error) {
    console.error('[addTask] Error adding task:', error)
    throw new Error('Failed to add task')
  }
}
