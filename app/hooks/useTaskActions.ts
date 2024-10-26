import { useSubmit } from '@remix-run/react'
import { useState } from 'react'

import { useTranslation } from '~/contexts/TranslationContext'
import { BoardColumn, Task } from '~/types/dataTypes'

type UseTaskActionsProps = {
  listId: string
  tasks: Task[]
  currentBoardColumn: BoardColumn
  boardColumns: BoardColumn[]
}

export const useTaskActions = ({ listId, tasks, currentBoardColumn, boardColumns }: UseTaskActionsProps) => {
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
   * @param {'prev' | 'next'} direction - The direction in which to move the task.
   */
  const handleMoveToColumn = (taskId: string, direction: 'prev' | 'next') => {
    setLoadingTaskId(taskId)
    const currentIndex = boardColumns.indexOf(currentBoardColumn)
    const targetColumn = direction === 'prev' ? boardColumns[currentIndex - 1] : boardColumns[currentIndex + 1]

    // Call the action to save the new board column.
    submit({ intent: 'move', listId, taskId, targetColumn }, { method: 'post' })
  }

  /**
   * Handles a vertical move of tasks, i.e., in the same board column.
   *
   * @param {string} taskId - The ID of the task being moved
   * @param {'up' | 'down'} direction - The direction of the vertical move action
   */
  const handleMoveVertically = (taskId: string, direction: 'up' | 'down') => {
    setLoadingTaskId(taskId)

    // Find tasks in the current column.
    const tasksInCurrentColumn = tasks.filter((task) => task.boardColumn === currentBoardColumn)

    const currentTaskIndex = tasksInCurrentColumn.findIndex((task) => task.id === taskId)
    if (currentTaskIndex === -1) {
      setLoadingTaskId(null)
      return
    }

    const targetTaskIndex = direction === 'up' ? currentTaskIndex - 1 : currentTaskIndex + 1

    if (targetTaskIndex < 0 || targetTaskIndex >= tasksInCurrentColumn.length) {
      setLoadingTaskId(null)
      return
    }

    const currentTask = tasksInCurrentColumn[currentTaskIndex]
    const targetTask = tasksInCurrentColumn[targetTaskIndex]

    // Swap positions.
    const targetPosition = targetTask.position
    targetTask.position = currentTask.position
    currentTask.position = targetPosition

    submit(
      {
        intent: 'moveVertically',
        listId,
        taskId: currentTask.id,
        targetTaskId: targetTask.id,
      },
      { method: 'post' }
    )
  }

  return {
    handleEdit,
    handleDelete,
    handleMoveToColumn,
    handleMoveVertically,
    loadingTaskId,
    setLoadingTaskId,
  }
}
