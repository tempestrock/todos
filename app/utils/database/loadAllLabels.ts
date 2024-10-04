import { ScanCommand } from '@aws-sdk/lib-dynamodb'

import { Label } from '~/types/dataTypes'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_LABELS } from '~/utils/database/dbConsts'
import { log } from '~/utils/log'

export async function loadAllLabels(): Promise<Label[]> {
  try {
    const scanParams = {
      TableName: getTableName(TABLE_NAME_LABELS),
    }

    const command = new ScanCommand(scanParams)
    const response = await dbClient().send(command)

    const labels = (response.Items as Label[]) || []

    return labels
  } catch (error) {
    log('[loadAllLabels]', error)
    throw error
  }
}
