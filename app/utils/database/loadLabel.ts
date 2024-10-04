import { GetCommand } from '@aws-sdk/lib-dynamodb'

import { Label } from '~/types/dataTypes'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_LABELS } from '~/utils/database/dbConsts'
import { log } from '~/utils/log'

export async function loadLabel(labelId: string): Promise<Label | undefined> {
  log(`Starting loadLabel(${labelId}).`)

  try {
    // Fetch the label directly by its unique ID
    const getParams = {
      TableName: getTableName(TABLE_NAME_LABELS),
      Key: {
        id: labelId,
      },
    }

    const command = new GetCommand(getParams)
    const response = await dbClient().send(command)

    const label = response.Item as Label | undefined

    // Verify that the label exists and belongs to the specified listId
    if (label) {
      return label
    } else {
      log(`Label with id ${labelId} not found.`)
      return undefined
    }
  } catch (error) {
    log('[loadLabel]', error)
    throw error
  }
}
