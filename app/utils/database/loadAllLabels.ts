import { ScanCommand } from '@aws-sdk/lib-dynamodb'

import { Label } from '~/types/dataTypes'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_LABELS } from '~/utils/database/dbConsts'

export async function loadAllLabels(): Promise<Label[]> {
  console.log('Starting loadAllLabels.')

  try {
    const scanParams = {
      TableName: getTableName(TABLE_NAME_LABELS),
    }

    const command = new ScanCommand(scanParams)
    const response = await dbClient().send(command)

    const labels = (response.Items as Label[]) || []

    console.log(`[loadAllLabels] Total labels fetched: ${labels.length}`)
    return labels
  } catch (error) {
    console.error('[loadAllLabels]', error)
    throw error
  }
}
