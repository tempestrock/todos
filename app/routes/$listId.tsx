import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLoaderData, useNavigation, useSubmit } from '@remix-run/react'
import {
  ArrowDownFromLine,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  ArrowUpFromLine,
  ChevronDown,
  ChevronUp,
  FilePenLine,
  Home,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'

import MoreMenu from '~/components/MoreMenu'
import Spinner from '~/components/Spinner'
import { useTranslation } from '~/contexts/TranslationContext'
import { Label, TaskList, BoardColumn, Task } from '~/types/dataTypes'
import { requireAuth } from '~/utils/auth/session.server'
import { deleteTask } from '~/utils/database/deleteTask'
import { loadLabels } from '~/utils/database/loadLabels'
import { loadTask } from '~/utils/database/loadTask'
import { loadTaskList } from '~/utils/database/loadTaskList'
import { updateBoardColumn } from '~/utils/database/saveAndUpdateData'
import { getNiceDateTime, getNow } from '~/utils/dateAndTime'
import { LANG_DEFAULT } from '~/utils/language'
import { moveUpTasksBelowPosition } from '~/utils/list/moveUpTasksBelowPosition'
import { pushTasksDown } from '~/utils/list/pushTasksDown'
import { swapTasks } from '~/utils/list/swapTasks'
import { log } from '~/utils/log'
import { useTaskStore } from '~/utils/store/useTaskStore'
import { capitalizeFirstLetter } from '~/utils/stringHandling'

/**
 * Displays the currently selected board column of the currently selected list.
 */

type LoaderData = {
  taskList: TaskList
  labels: Label[]
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth(request)

  try {
    if (!params.listId) throw new Error('[$listId.loader] No list ID provided')

    const taskList = await loadTaskList(params.listId)

    // Sort tasks by position.
    taskList.tasks.sort((a, b) => a.position - b.position)

    // Collect all label IDs from tasks
    const labelIdsSet = new Set<string>()
    taskList.tasks.forEach((task) => {
      task.labelIds.forEach((labelId) => labelIdsSet.add(labelId))
    })
    const labelIds = Array.from(labelIdsSet)

    // Load labels from the database
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

  const listId = taskList.id
  const listColor = taskList.color
  const boardColumns = Object.values(BoardColumn)
  const navigation = useNavigation()

  const [currentBoardColumnIndex, setCurrentBoardColumnIndex] = useState(0)
  const currentBoardColumn = boardColumns[currentBoardColumnIndex]

  const { t } = useTranslation()
  const currentLang = typeof window !== 'undefined' ? localStorage.getItem('lang') || LANG_DEFAULT : LANG_DEFAULT

  // Use the store
  const tasks = useTaskStore((state) => state.tasks)
  const setTasks = useTaskStore((state) => state.setTasks)
  const visibleTaskDetails = useTaskStore((state) => state.visibleTaskDetails)
  const toggleTaskDetails = useTaskStore((state) => state.toggleTaskDetails)

  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null)
  const [loadingHome, setLoadingHome] = useState<boolean>(false)

  // State for selected labels
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])

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

  const handleColumnChange = (index: number) => setCurrentBoardColumnIndex(index)

  const handleToggleTaskDetails = (taskId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    toggleTaskDetails(taskId)
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

    // Call the action to save the new board column.
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

  // Function to handle label selection
  const handleLabelFilterChange = (labelId: string) => {
    setSelectedLabelIds((prevSelected) => {
      if (prevSelected.includes(labelId)) {
        return prevSelected.filter((id) => id !== labelId)
      } else {
        return [...prevSelected, labelId]
      }
    })
  }

  const tasksInCurrentColumn = useMemo(() => {
    return tasks
      .filter((task) => {
        if (task.boardColumn !== currentBoardColumn) return false
        if (selectedLabelIds.length === 0) return true
        // Include tasks that have all selected labels
        return selectedLabelIds.every((labelId) => task.labelIds.includes(labelId))
      })
      .sort((a, b) => a.position - b.position)
  }, [tasks, currentBoardColumn, selectedLabelIds])

  return (
    <div className="container mx-auto">
      {/* Fixed Title bar */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 z-10 shadow-md">
        <div className="container mx-auto p-4 flex justify-between items-center">
          {/* Home Button */}
          <Link to="/" className="text-xs text-blue-500 hover:text-blue-700" onClick={handleHomeClick}>
            {loadingHome ? <Spinner size={24} lightModeColor="text-blue-500" /> : <Home size={24} />}
          </Link>

          {/* Board Column Buttons */}
          <div className="flex space-x-1">
            {boardColumns.map((column, index) => (
              <button
                key={column}
                onClick={() => handleColumnChange(index)}
                className={`px-2 py-2 text-xs font-medium rounded-md transition-colors duration-150 border`}
                style={{
                  backgroundColor: index === currentBoardColumnIndex ? listColor : 'transparent',
                  color: index === currentBoardColumnIndex ? 'white' : listColor,
                  borderColor: listColor,
                }}
              >
                {capitalizeFirstLetter(t[column])} (
                {tasks.filter((task) => task.boardColumn === boardColumns[index]).length})
              </button>
            ))}
          </div>

          {/* 'More' Menu */}
          <MoreMenu hasAddButton={true} listId={listId} currentBoardColumn={currentBoardColumn} />
        </div>
      </div>

      {/* Label Filter */}
      <div className="px-4 pt-20">
        <div className="flex flex-wrap gap-2 mb-4">
          {labels
            .sort((a, b) => a?.displayName[currentLang].localeCompare(b?.displayName[currentLang]))
            .map((label) => (
              <button
                key={label.id}
                onClick={() => handleLabelFilterChange(label.id)}
                className={`px-2 py-1 rounded text-xs text-gray-100 transition-opacity duration-150 ${
                  selectedLabelIds.includes(label.id) ? 'opacity-100' : 'opacity-50'
                }`}
                style={{
                  backgroundColor: label.color,
                }}
              >
                {label.displayName[currentLang] || label.displayName[LANG_DEFAULT]}
              </button>
            ))}
        </div>
      </div>

      {/* Task list */}
      <div className="pt-20 px-4">
        <ul className="space-y-4">
          {/* "Loop" over all tasks in the current column */}
          {tasksInCurrentColumn.map((task, index) => (
            <li
              key={task.id}
              className="border px-4 pt-2 rounded relative cursor-pointer text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 hover:dark:bg-gray-700 transition-colors duration-150"
              onClick={(e) => handleToggleTaskDetails(task.id, e)}
            >
              {/* Title and chevron icon */}
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold">{task.title}</div>
                <div className={`text-gray-600 dark:text-gray-300 ${task.details === '' ? 'opacity-30' : ''}`}>
                  {visibleTaskDetails[task.id] ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
              </div>

              {/* Labels of the task */}
              {task.labelIds.length > 0 && (
                <div className="mb-3">
                  {task.labelIds
                    .map((labelId) => labelsMap.get(labelId))
                    .filter((label) => label !== undefined)
                    .sort((a, b) => a?.displayName[currentLang].localeCompare(b?.displayName[currentLang]))
                    .map((label) => {
                      return (
                        <span
                          key={label.id}
                          className="px-2 py-1 mr-2 rounded text-xs text-gray-100"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.displayName[currentLang] || label.displayName[LANG_DEFAULT]}
                        </span>
                      )
                    })}
                </div>
              )}

              {/* Details and tools for task */}
              {visibleTaskDetails[task.id] && (
                <div>
                  {/* Creation date and update date */}
                  <div className="text-xs -mt-2 text-gray-600 dark:text-gray-400 flex gap-4">
                    <div>
                      {t['created']}: {getNiceDateTime(task.createdAt, currentLang)}
                    </div>
                    <div>
                      {t['updated']}: {getNiceDateTime(task.updatedAt, currentLang)}
                    </div>
                  </div>

                  {/* Task details */}
                  <div className="mt-2 text-gray-900 dark:text-gray-100 dark:prose-dark prose">
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
                      }}
                    >
                      {task.details}
                    </ReactMarkdown>
                  </div>

                  {/* Task Tools (Edit, Move, Reorder, Delete) */}
                  <div className="mt-4 mb-3 flex justify-between items-center">
                    <div className="flex space-x-6">
                      <Link
                        to={`/editTask?listId=${listId}&taskId=${task.id}&boardColumn=${currentBoardColumn}`}
                        className="text-blue-500 hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(task.id)
                        }}
                      >
                        <FilePenLine size={20} />
                      </Link>

                      <button
                        onClick={() => handleMove(task.id, 'prev')}
                        className={`text-green-500 hover:text-green-700 ${
                          currentBoardColumnIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={currentBoardColumnIndex === 0}
                      >
                        <ArrowLeftFromLine size={20} />
                      </button>

                      <button
                        onClick={() => handleMove(task.id, 'next')}
                        className={`text-green-500 hover:text-green-700 ${
                          currentBoardColumnIndex === boardColumns.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={currentBoardColumnIndex === boardColumns.length - 1}
                      >
                        <ArrowRightFromLine size={20} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReorder(task.id, 'up')
                        }}
                        className={`text-teal-500 hover:text-teal-700 ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={index === 0}
                      >
                        <ArrowUpFromLine size={20} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReorder(task.id, 'down')
                        }}
                        className={`text-teal-500 hover:text-teal-700 ${
                          index === tasksInCurrentColumn.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={index === tasksInCurrentColumn.length - 1}
                      >
                        <ArrowDownFromLine size={20} />
                      </button>
                    </div>

                    <button onClick={() => handleDelete(task.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              )}

              {/* Spinner Overlay */}
              {loadingTaskId === task.id && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-65 flex justify-center items-center z-10">
                  <Spinner size={40} lightModeColor="text-gray-100" />
                </div>
              )}
            </li>
          ))}
        </ul>
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
