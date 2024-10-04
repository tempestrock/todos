import { BatchGetCommand } from '@aws-sdk/lib-dynamodb'

import { Label } from '~/types/dataTypes'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_LABELS } from '~/utils/database/dbConsts'
import { log } from '~/utils/log'

export async function loadLabels(labelIds: string[]): Promise<Label[]> {
  log(`Starting loadLabels for labelIds: ${labelIds.join(', ')}`)

  if (labelIds.length === 0) {
    return [] // Return an empty array if there are no label IDs to fetch
  }

  try {
    // Split labelIds into chunks if necessary (DynamoDB BatchGet has a 100-item limit)
    const maxBatchSize = 100
    const batches = []
    for (let i = 0; i < labelIds.length; i += maxBatchSize) {
      batches.push(labelIds.slice(i, i + maxBatchSize))
    }

    const labels: Label[] = []

    // Process each batch of label IDs
    for (const batch of batches) {
      const batchGetParams = {
        RequestItems: {
          [getTableName(TABLE_NAME_LABELS)]: {
            Keys: batch.map((labelId) => ({
              id: labelId,
            })),
          },
        },
      }

      const command = new BatchGetCommand(batchGetParams)
      const response = await dbClient().send(command)

      const fetchedLabels = (response.Responses?.[getTableName(TABLE_NAME_LABELS)] as Label[]) || []
      labels.push(...fetchedLabels)

      log(`[loadLabels] Fetched ${fetchedLabels.length} labels in this batch`)
    }

    log(`[loadLabels] Total labels fetched: ${labels.length}`)
    return labels
  } catch (error) {
    console.error('[loadLabels] Error fetching labels:', error)
    throw error
  }
}
