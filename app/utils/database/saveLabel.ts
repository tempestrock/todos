import { PutCommand } from '@aws-sdk/lib-dynamodb'

import { Label } from '~/types/dataTypes'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_LABELS } from '~/utils/database/dbConsts'

export async function saveLabel(label: Label): Promise<void> {
  console.log(`Starting saveLabel for labelId: ${label.id}`)

  try {
    const putParams = {
      TableName: getTableName(TABLE_NAME_LABELS),
      Item: label,
    }

    const command = new PutCommand(putParams)
    await dbClient().send(command)

    console.log(`[saveLabel] Label with id ${label.id} saved successfully`)
  } catch (error) {
    console.error('[saveLabel] Error saving label:', error)
    throw error
  }
}
