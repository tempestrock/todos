import { PutCommand } from '@aws-sdk/lib-dynamodb'

import { Label } from '~/types/dataTypes'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_LABELS } from '~/utils/database/dbConsts'
import { log } from '~/utils/log'

export async function saveLabel(label: Label): Promise<void> {
  try {
    const putParams = {
      TableName: getTableName(TABLE_NAME_LABELS),
      Item: label,
    }

    const command = new PutCommand(putParams)
    await dbClient().send(command)
  } catch (error) {
    log('[saveLabel] Error saving label:', error)
    throw error
  }
}
