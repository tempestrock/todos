import { useSubmit } from '@remix-run/react'
import { useState } from 'react'

import { useTranslation } from '~/contexts/TranslationContext'
import { BoardColumn } from '~/types/dataTypes'
import { HorizontalMoveTarget, VerticalMoveTarget } from '~/types/moveTargets'

type UseTaskActionsProps = {
  listId: string
  currentBoardColumn: BoardColumn
  boardColumns: BoardColumn[]
}

export const useTaskActions = ({ listId, currentBoardColumn, boardColumns }: UseTaskActionsProps) => {
  const submit = useSubmit()
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null)
  const { t } = useTranslation()

  const handleEdit = (taskId: string) => {
    setLoadingTaskId(taskId)
  }

  const handleDelete = (taskId: string) => {
    if (confirm(t['confirm-task-deletion'])) {
      setLoadingTaskId(taskId)

      // Call the action to delete the task in the database.
      submit({ intent: 'delete', listId, taskId }, { method: 'post' })
    }
  }

  /**
   * Handles a horizontal move of a task to a new board column based on the given taskId and direction.
   *
   * @param {string} taskId - The ID of the task to be moved.
   * @param {HorizontalMoveTarget} direction - The direction in which to move the task.
   */
  const handleHorizontalMove = (taskId: string, direction: HorizontalMoveTarget) => {
    setLoadingTaskId(taskId)
    const currentIndex = boardColumns.indexOf(currentBoardColumn)
    const targetColumn =
      direction === HorizontalMoveTarget.oneLeft ? boardColumns[currentIndex - 1] : boardColumns[currentIndex + 1]

    // Call the action to move the task to the new board column.
    submit({ intent: 'moveHorizontally', listId, taskId, targetColumn }, { method: 'post' })
  }

  /**
   * Handles a vertical move of tasks, i.e., in the same board column.
   *
   * @param {string} taskId - The ID of the task being moved
   * @param {VerticalMoveTarget} moveTarget - The target of the vertical move action
   */
  const handleVerticalMove = (taskId: string, moveTarget: VerticalMoveTarget) => {
    setLoadingTaskId(taskId)

    submit(
      {
        intent: 'moveVertically',
        listId,
        taskId,
        moveTarget,
      },
      { method: 'post' }
    )
  }

  return {
    handleEdit,
    handleDelete,
    handleHorizontalMove,
    handleVerticalMove,
    loadingTaskId,
    setLoadingTaskId,
  }
}
