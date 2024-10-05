import { useSubmit } from '@remix-run/react'
import { useState } from 'react'

import { useTranslation } from '~/contexts/TranslationContext'
import { BoardColumn } from '~/types/dataTypes'
import { useTaskStore } from '~/utils/store/useTaskStore'

type UseTaskActionsProps = {
  listId: string
  currentBoardColumn: BoardColumn
  boardColumns: BoardColumn[]
}

export const useTaskActions = ({ listId, currentBoardColumn, boardColumns }: UseTaskActionsProps) => {
  const submit = useSubmit()
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null)
  const setTasks = useTaskStore((state) => state.setTasks)
  const { t } = useTranslation()

  const handleEdit = (taskId: string) => {
    setLoadingTaskId(taskId)
  }

  const handleDelete = (taskId: string) => {
    setLoadingTaskId(taskId)
    if (confirm(t['confirm-deletion'])) {
      // Call the action to delete the task in the database.
      submit({ intent: 'delete', listId, taskId }, { method: 'post' })
    }
  }

  const handleMove = (taskId: string, direction: 'prev' | 'next') => {
    setLoadingTaskId(taskId)
    const currentIndex = boardColumns.indexOf(currentBoardColumn)
    const targetColumn = direction === 'prev' ? boardColumns[currentIndex - 1] : boardColumns[currentIndex + 1]

    // Call the action to save the new board column.
    submit({ intent: 'move', listId, taskId, targetColumn }, { method: 'post' })
  }

  const handleReorder = (taskId: string, direction: 'up' | 'down') => {
    setLoadingTaskId(taskId)

    // Get the current tasks from the store.
    const currentTasks = useTaskStore.getState().tasks

    // Find tasks in the current column.
    const tasksInCurrentColumn = currentTasks.filter((task) => task.boardColumn === currentBoardColumn)

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

    // Update positions.
    const updatedTasks = currentTasks.map((task) => {
      if (task.id === currentTask.id) {
        return { ...task, position: targetTask.position }
      }
      if (task.id === targetTask.id) {
        return { ...task, position: currentTask.position }
      }
      return task
    })

    // Update tasks in the store.
    setTasks(updatedTasks)

    submit(
      {
        intent: 'reorder',
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
    handleMove,
    handleReorder,
    loadingTaskId,
    setLoadingTaskId,
  }
}
