import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Outlet, useLoaderData, useNavigation, useSubmit, useSearchParams } from '@remix-run/react'
import { useEffect, useMemo, useState } from 'react'

import TaskList from '~/components/TaskList'
import TaskListHeader from '~/components/TaskListHeader'
import TaskListLabelFilter from '~/components/TaskListLabelFilter'
import { useTranslation } from '~/contexts/TranslationContext'
import { Label, TaskList as TaskListType, BoardColumn, Task } from '~/types/dataTypes'
import { requireAuth } from '~/utils/auth/session.server'
import { deleteTask } from '~/utils/database/deleteTask'
import { loadLabels } from '~/utils/database/loadLabels'
import { loadTask } from '~/utils/database/loadTask'
import { loadTaskList } from '~/utils/database/loadTaskList'
import { updateBoardColumn } from '~/utils/database/saveAndUpdateData'
import { getNow } from '~/utils/dateAndTime'
import { LANG_DEFAULT } from '~/utils/language'
import { moveUpTasksBelowPosition } from '~/utils/list/moveUpTasksBelowPosition'
import { pushTasksDown } from '~/utils/list/pushTasksDown'
import { swapTasks } from '~/utils/list/swapTasks'
import { log } from '~/utils/log'
import { useTaskStore } from '~/utils/store/useTaskStore'

type LoaderData = {
  taskList: TaskListType
  labels: Label[]
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth(request)

  try {
    if (!params.listId) throw new Error('[$listId.loader] No list ID provided')

    const taskList = await loadTaskList(params.listId)

    // Sort tasks by position.
    taskList.tasks.sort((a, b) => a.position - b.position)

    // Collect all label IDs from tasks.
    const labelIdsSet = new Set<string>()
    taskList.tasks.forEach((task) => {
      task.labelIds.forEach((labelId) => labelIdsSet.add(labelId))
    })
    const labelIds = Array.from(labelIdsSet)

    // Load labels from the database.
    const labels = await loadLabels(labelIds)

    return json<LoaderData>({ taskList, labels })
  } catch (error) {
    log('[$listId.loader] Error loading tasks:', error)
    return json({ error: '[$listId.loader] Failed to load tasks' }, { status: 500 })
  }
}

export default function ListView() {
  const { taskList, labels } = useLoaderData<LoaderData>()
  const submit = useSubmit()
  const [searchParams] = useSearchParams()

  const listId = taskList.id
  const listColor = taskList.color

  // Get the boardColumn parameter from the URL.
  const boardColumns = Object.values(BoardColumn)
  const navigation = useNavigation()

  const initialBoardColumn = searchParams.get('boardColumn') as BoardColumn | null
  const initialBoardColumnIndex = initialBoardColumn ? boardColumns.indexOf(initialBoardColumn) : 0
  const validatedBoardColumnIndex = initialBoardColumnIndex >= 0 ? initialBoardColumnIndex : 0

  const [currentBoardColumnIndex, setCurrentBoardColumnIndex] = useState(validatedBoardColumnIndex)
  const currentBoardColumn = boardColumns[currentBoardColumnIndex]

  const { t } = useTranslation()
  const currentLang = typeof window !== 'undefined' ? localStorage.getItem('lang') || LANG_DEFAULT : LANG_DEFAULT

  // Use the store
  const tasks = useTaskStore((state) => state.tasks)
  const setTasks = useTaskStore((state) => state.setTasks)

  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null)
  const [loadingHome, setLoadingHome] = useState<boolean>(false)

  // State for selected labels
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [labelFilterVisible, setLabelFilterVisible] = useState(false)

  // Create a map of labels for efficient lookup
  const labelsMap = useMemo(() => {
    const map = new Map<string, Label>()
    labels.forEach((label) => map.set(label.id, label))
    return map
  }, [labels])

  // Initialize tasks in the store
  useEffect(() => {
    setTasks(taskList.tasks)
  }, [taskList.tasks, setTasks])

  // Reset loading state when navigation is idle
  useEffect(() => {
    if (navigation.state === 'idle') {
      // Reset spinner once the navigation completes. This is necessary for
      // the spinner of the reordering and movement of tasks to work correctly.
      setLoadingTaskId(null)
    }
  }, [navigation.state])

  const handleHomeClick = () => {
    setLoadingHome(true)
  }

  const handleColumnChange = (index: number) => {
    setCurrentBoardColumnIndex(index)
    // const newBoardColumn = boardColumns[index]
    // Optionally update the URL
    // navigate(`/${listId}?boardColumn=${newBoardColumn}`, { replace: true })
  }

  const handleEdit = (taskId: string) => {
    setLoadingTaskId(taskId)
  }

  const handleDelete = (taskId: string) => {
    setLoadingTaskId(taskId)
    if (confirm('Are you sure you want to delete this task?')) {
      // Call the action to delete the task in the database.
      submit({ intent: 'delete', listId, taskId }, { method: 'post' })
    }
  }

  const handleMove = (taskId: string, direction: 'prev' | 'next') => {
    setLoadingTaskId(taskId)
    const currentIndex = boardColumns.indexOf(currentBoardColumn)
    const targetColumn = direction === 'prev' ? boardColumns[currentIndex - 1] : boardColumns[currentIndex + 1]

    submit({ intent: 'move', listId, taskId, targetColumn }, { method: 'post' })
  }

  const handleReorder = (taskId: string, direction: 'up' | 'down') => {
    setLoadingTaskId(taskId)

    // Get the current tasks from the store
    const currentTasks = useTaskStore.getState().tasks

    // Find tasks in the current column
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

    // Update positions
    const updatedTasks = currentTasks.map((task) => {
      if (task.id === currentTask.id) {
        return { ...task, position: targetTask.position }
      }
      if (task.id === targetTask.id) {
        return { ...task, position: currentTask.position }
      }
      return task
    })

    // Update tasks in the store
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

  const toggleLabelFilterVisibility = () => setLabelFilterVisible(!labelFilterVisible)

  const clearLabelFilters = () => {
    setSelectedLabelIds([])
  }

  const tasksInCurrentColumn = useMemo(() => {
    return tasks
      .filter((task) => {
        if (task.boardColumn !== currentBoardColumn) return false
        if (selectedLabelIds.length === 0 || !labelFilterVisible) return true
        // Include tasks that have all selected labels.
        return selectedLabelIds.every((labelId) => task.labelIds.includes(labelId))
      })
      .sort((a, b) => a.position - b.position)
  }, [tasks, currentBoardColumn, selectedLabelIds, labelFilterVisible])

  return (
    <div className="container mx-auto">
      {/* TaskListHeader */}
      <TaskListHeader
        listId={listId}
        listColor={listColor}
        boardColumns={boardColumns}
        currentBoardColumnIndex={currentBoardColumnIndex}
        handleHomeClick={handleHomeClick}
        handleColumnChange={handleColumnChange}
        toggleLabelFilterVisibility={toggleLabelFilterVisibility}
        labelFilterVisible={labelFilterVisible}
        loadingHome={loadingHome}
        currentBoardColumn={currentBoardColumn}
      />

      {/* Label Filter */}
      <TaskListLabelFilter
        labels={labels}
        selectedLabelIds={selectedLabelIds}
        setSelectedLabelIds={setSelectedLabelIds}
        labelFilterVisible={labelFilterVisible}
        clearLabelFilters={clearLabelFilters}
        currentLang={currentLang}
      />

      {/* Task List */}
      <div className={`${labelFilterVisible ? 'pt-4' : 'pt-20'} px-4`}>
        {tasksInCurrentColumn.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400">{t['no-tasks-match-selected-labels']}</div>
        ) : (
          <TaskList
            tasks={tasksInCurrentColumn}
            labelsMap={labelsMap}
            currentLang={currentLang}
            listId={listId}
            currentBoardColumn={currentBoardColumn}
            handleEdit={handleEdit}
            handleMove={handleMove}
            handleDelete={handleDelete}
            handleReorder={handleReorder}
            loadingTaskId={loadingTaskId}
            currentBoardColumnIndex={currentBoardColumnIndex}
            boardColumns={boardColumns}
          />
        )}
      </div>

      <Outlet />
    </div>
  )
}

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData()
  const intent = formData.get('intent') as string
  const listId = formData.get('listId') as string
  const taskId = formData.get('taskId') as string

  try {
    switch (intent) {
      case 'delete': {
        const taskToDelete = await loadTask(taskId)
        if (!taskToDelete) throw new Error(`Could not find task '${taskId}' to delete.`)

        const boardColumnOfDeletedTask = taskToDelete.boardColumn
        const positionOfDeletedTask = taskToDelete.position

        await deleteTask(listId, taskId)
        await moveUpTasksBelowPosition(listId, boardColumnOfDeletedTask, positionOfDeletedTask)

        return json({ success: true, message: 'Task deleted successfully' })
      }

      case 'move': {
        const targetColumn = formData.get('targetColumn') as BoardColumn
        const taskToUpdate = await loadTask(taskId)
        if (!taskToUpdate) throw new Error(`Could not find task '${taskId}' to update.`)

        const boardColumnSoFar = taskToUpdate.boardColumn
        const positionSoFar = taskToUpdate.position

        // Update the task with the new column
        const updatedTask: Task = {
          ...taskToUpdate,
          position: 0, // Put the new task at the top of the list in the new board column.
          boardColumn: targetColumn,
          updatedAt: getNow(),
        }

        // Push all tasks in the target column down one position as the moved task is now at the top.
        await pushTasksDown(listId, targetColumn)

        // Save the updated task.
        await updateBoardColumn(updatedTask)

        // Move all tasks below the moved task up one position.
        await moveUpTasksBelowPosition(listId, boardColumnSoFar, positionSoFar)

        return json({ success: true, message: 'Task moved successfully' })
      }

      case 'reorder': {
        const targetTaskId = formData.get('targetTaskId') as string

        await swapTasks(taskId, targetTaskId)

        return json({ success: true, message: 'Task reordered successfully' })
      }

      default:
        return json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    log('[$listId.action]', error)
    return json({ error: '[$listId.action] Failed to process action' }, { status: 500 })
  }
}
