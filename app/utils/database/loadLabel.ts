import { GetCommand } from '@aws-sdk/lib-dynamodb'

import { printObject } from '../printObject'
import { Label } from '~/types/dataTypes'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_LABELS } from '~/utils/database/dbConsts'

export async function loadLabel(labelId: string): Promise<Label | undefined> {
  console.log(`Starting loadLabel(${labelId}).`)

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
      printObject(label, '[loadLabel] label found')
      return label
    } else {
      console.error(`Label with id ${labelId} not found.`)
      return undefined
    }
  } catch (error) {
    console.error('[loadLabel]', error)
    throw error
  }
}
