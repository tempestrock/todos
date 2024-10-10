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
    return []
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
