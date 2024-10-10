// utils/database/labelOperations.ts
import {
  ScanCommand,
  GetCommand,
  BatchGetCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

import { Label } from '~/types/dataTypes'
import { dbClient } from '~/utils/database/dbClient'
import { getTableName, TABLE_NAME_LABELS } from '~/utils/database/dbConsts'
import { getUid } from '~/utils/getUid'
import { log } from '~/utils/log'

/**
 * Loads all labels from the labels table.
 */
export const loadAllLabels = async (): Promise<Label[]> => {
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

/**
 * Loads a single label by its ID.
 */
export const loadLabel = async (labelId: string): Promise<Label | undefined> => {
  try {
    const getParams = {
      TableName: getTableName(TABLE_NAME_LABELS),
      Key: {
        id: labelId,
      },
    }

    const command = new GetCommand(getParams)
    const response = await dbClient().send(command)

    const label = response.Item as Label | undefined

    // Verify that the label exists and belongs to the specified listId.
    if (label) {
      return label
    } else {
      log(`[loadLabel] Label with id ${labelId} not found.`)
      return undefined
    }
  } catch (error) {
    log('[loadLabel]', error)
    throw error
  }
}

/**
 * Loads multiple labels by their IDs.
 */
export const loadLabels = async (labelIds: string[]): Promise<Label[]> => {
  if (labelIds.length === 0) {
    return [] // Return an empty array if there are no label IDs to fetch
  }

  try {
    // Batch get labels in chunks (max 100 items per request)
    const maxBatchSize = 100
    const batches = []
    for (let i = 0; i < labelIds.length; i += maxBatchSize) {
      batches.push(labelIds.slice(i, i + maxBatchSize))
    }

    const labels: Label[] = []

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
    }

    return labels
  } catch (error) {
    log('[loadLabels] Error fetching labels:', error)
    throw error
  }
}

/**
 * Creates a new label.
 */
export const createLabel = async (data: { displayName: { [key: string]: string }; color: string }): Promise<void> => {
  try {
    const newLabel: Label = {
      id: getUid(),
      displayName: data.displayName,
      color: data.color,
    }

    const putParams = {
      TableName: getTableName(TABLE_NAME_LABELS),
      Item: newLabel,
    }

    const command = new PutCommand(putParams)
    await dbClient().send(command)
  } catch (error) {
    log('[createLabel]', error)
    throw error
  }
}

/**
 * Saves a label to the database.
 *
 * @param {Label} label - The label to be saved.
 * @return {Promise<void>} A promise that resolves when the label is saved.
 */
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

/**
 * Updates an existing label.
 */
export const updateLabel = async (
  labelId: string,
  data: { displayName: { [key: string]: string }; color: string }
): Promise<void> => {
  try {
    const updateParams = {
      TableName: getTableName(TABLE_NAME_LABELS),
      Key: { id: labelId },
      UpdateExpression: 'SET displayName = :displayName, color = :color',
      ExpressionAttributeValues: {
        ':displayName': data.displayName,
        ':color': data.color,
      },
    }

    const command = new UpdateCommand(updateParams)
    await dbClient().send(command)
  } catch (error) {
    log('[updateLabel]', error)
    throw error
  }
}

/**
 * Deletes a label.
 */
export const deleteLabel = async (labelId: string): Promise<void> => {
  try {
    const deleteParams = {
      TableName: getTableName(TABLE_NAME_LABELS),
      Key: { id: labelId },
    }

    const command = new DeleteCommand(deleteParams)
    await dbClient().send(command)
  } catch (error) {
    log('[deleteLabel]', error)
    throw error
  }
}
