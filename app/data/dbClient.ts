import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

let docClient: DynamoDBDocumentClient | undefined = undefined

export const dbClient = (): DynamoDBDocumentClient => {
  if (docClient) return docClient

  // Configure the DynamoDB client using environment variables
  const client = new DynamoDBClient({
    region: process.env.REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    },
  })

  docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      convertEmptyValues: false, // false by default
      removeUndefinedValues: true, // Removes undefined values while marshalling
      convertClassInstanceToMap: true, // Automatically convert class instances to maps
    },
    unmarshallOptions: {
      wrapNumbers: false, // If you have large numbers, set to true to handle as BigInt
    },
  })

  return docClient
}
