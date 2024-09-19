import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLoaderData, useSubmit } from '@remix-run/react'
import {
  ArrowBigLeft,
  ArrowBigRight,
  ArrowDownFromLine,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  ArrowUpFromLine,
  ChevronDown,
  ChevronUp,
  CirclePlus,
  FilePenLine,
  Home,
  PanelTopClose,
  PanelTopOpen,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

import { deleteTask } from '~/data/deleteTask'
import { loadTask } from '~/data/loadTask'
import { loadTaskList } from '~/data/loadTaskList'
import { updateBoardColumn } from '~/data/saveAndUpdateData'
import { moveUpTasksBelowPosition } from '~/listUtils/moveUpTasksBelowPosition'
import { pushTasksDown } from '~/listUtils/pushTasksDown'
import { swapTasks } from '~/listUtils/swapTasks'
import { Label, TaskList, BoardColumn, Task } from '~/types/dataTypes'
import { getNiceDateTime, getNow } from '~/utils/dateAndTime'
import { printObject } from '~/utils/printObject'
import { requireAuth } from '~/utils/session.server'

/**
 * Displays the currently selected board column of the currently selected list.
 */

type LoaderData = {
  taskList: TaskList
  labels: Label[]
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  console.log('[$listId.loader] starting')
  printObject(request, '[$listId.loader] request')
  printObject(params, '[$listId.loader] params')

  await requireAuth(request)

  try {
    if (!params.listId) throw new Error('[$listId.loader] No list ID provided')

    const taskList = await loadTaskList(params.listId)

    // Sort tasks by position.
    taskList.tasks.sort((a, b) => a.position - b.position)

    return json<LoaderData>({ taskList, labels: [] })
  } catch (error) {
    console.error('[$listId.loader] Error loading tasks:', error)
    return json({ error: '[$listId.loader] Failed to load tasks' }, { status: 500 })
  }
}

export default function ListView() {
  const { taskList } = useLoaderData<LoaderData>()
  const submit = useSubmit()

  const listId = taskList.id
  const boardColumns = Object.values(BoardColumn)
  const [currentBoardColumnIndex, setCurrentBoardColumnIndex] = useState(0)
  const [showTools, setShowTools] = useState(false)
  const [visibleTaskDetails, setVisibleTaskDetails] = useState<Record<string, boolean>>({})
  const currentBoardColumn = boardColumns[currentBoardColumnIndex]

  const handlePrevBoardColumn = () => {
    if (currentBoardColumnIndex > 0) setCurrentBoardColumnIndex(currentBoardColumnIndex - 1)
  }

  const handleNextBoardColumn = () => {
    if (currentBoardColumnIndex < boardColumns.length - 1) setCurrentBoardColumnIndex(currentBoardColumnIndex + 1)
  }

  const handleColumnChange = (index: number) => setCurrentBoardColumnIndex(index)

  const toggleTaskDetails = (taskId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent the click from triggering other elements
    setVisibleTaskDetails((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
  }

  const toggleTools = () => setShowTools((prev) => !prev)

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      // Call the action to delete the task in the database.
      submit({ intent: 'delete', listId, taskId }, { method: 'post' })
    }
  }

  const handleMove = (taskId: string, direction: 'prev' | 'next') => {
    const currentIndex = boardColumns.indexOf(currentBoardColumn)
    const targetColumn = direction === 'prev' ? boardColumns[currentIndex - 1] : boardColumns[currentIndex + 1]

    // Call the action to save the new board column.
    submit({ intent: 'move', listId, taskId, targetColumn }, { method: 'post' })
  }

  const handleReorder = (taskId: string, direction: 'up' | 'down') => {
    const currentTask = taskList.tasks.find((task) => task.id === taskId)
    if (!currentTask) throw new Error(`[handleReorder] currentTask with id '${taskId}' not found`)

    const currentPosition = currentTask.position
    const targetPosition = direction === 'up' ? currentPosition - 1 : currentPosition + 1

    // Find the task at the target position in the current column.
    const targetTask = taskList.tasks.find(
      (task) => task.boardColumn == currentBoardColumn && task.position === targetPosition
    )
    if (!targetTask)
      throw new Error(
        `[handleReorder] targetTask with position '${targetPosition}' not found in column '${currentBoardColumn}'`
      )

    submit(
      {
        intent: 'reorder',
        listId,
        taskId,
        targetTaskId: targetTask.id,
      },
      { method: 'post' }
    )
  }

  return (
    <div className="container mx-auto p-4">
      {/* Title bar */}
      <div className="flex justify-between items-center mb-4">
        <Link to="/" className="text-xs text-blue-500 hover:text-blue-700">
          <Home size={24} />
        </Link>
        <button onClick={toggleTools} className={`text-xs text-blue-500 hover:text-blue-700`}>
          {showTools ? <PanelTopOpen size={24} /> : <PanelTopClose size={24} />}
        </button>

        <div className="flex space-x-1">
          {boardColumns.map((column, index) => (
            <button
              key={column}
              onClick={() => handleColumnChange(index)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                index === currentBoardColumnIndex
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-blue-500 hover:bg-blue-100'
              }`}
            >
              {column}
            </button>
          ))}
        </div>

        <Link
          to={`/addTask?listId=${listId}&boardColumn=${currentBoardColumn}`}
          className="text-green-500 hover:text-green-700"
        >
          <CirclePlus size={24} />
        </Link>
      </div>

      {/* Task list */}
      <ul className="space-y-4">
        {taskList?.tasks
          .filter((task) => task.boardColumn === currentBoardColumn)
          .map((task, index, tasksInCurrentColumn) => (
            <li
              key={task.id}
              className="border p-4 rounded relative cursor-pointer hover:bg-gray-50 transition-colors duration-150"
              onClick={(e) => toggleTaskDetails(task.id, e)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold">{task.title}</div>
                <div className={`text-gray-500 ${task.details === '' ? 'opacity-50' : ''}`}>
                  {visibleTaskDetails[task.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {visibleTaskDetails[task.id] && (
                <div>
                  <div className="text-sm text-gray-600 flex gap-4">
                    <div>Created: {getNiceDateTime(task.createdAt)}</div>
                    <div>Updated: {getNiceDateTime(task.updatedAt)}</div>
                  </div>
                  <div className="mt-2 text-gray-700 prose">
                    <ReactMarkdown>{task.details}</ReactMarkdown>
                  </div>
                </div>
              )}

              <div className="mt-2 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                <div className="flex space-x-6">
                  {showTools && (
                    <Link
                      to={`/editTask?listId=${listId}&taskId=${task.id}&boardColumn=${currentBoardColumn}`}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FilePenLine size={20} />
                    </Link>
                  )}

                  {showTools && (
                    <button
                      onClick={() => handleMove(task.id, 'prev')}
                      className={`text-green-500 hover:text-green-700 ${currentBoardColumnIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={currentBoardColumnIndex === 0}
                    >
                      <ArrowLeftFromLine size={20} />
                    </button>
                  )}

                  {showTools && (
                    <button
                      onClick={() => handleMove(task.id, 'next')}
                      className={`text-green-500 hover:text-green-700 ${currentBoardColumnIndex === boardColumns.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={currentBoardColumnIndex === boardColumns.length - 1}
                    >
                      <ArrowRightFromLine size={20} />
                    </button>
                  )}

                  {showTools && (
                    <button
                      onClick={() => handleReorder(task.id, 'up')}
                      className={`text-teal-500 hover:text-teal-700 ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={index === 0}
                    >
                      <ArrowUpFromLine size={20} />
                    </button>
                  )}

                  {showTools && (
                    <button
                      onClick={() => handleReorder(task.id, 'down')}
                      className={`text-teal-500 hover:text-teal-700 ${index === tasksInCurrentColumn.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={index === tasksInCurrentColumn.length - 1}
                    >
                      <ArrowDownFromLine size={20} />
                    </button>
                  )}
                </div>

                {showTools && (
                  <button onClick={() => handleDelete(task.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </li>
          ))}
      </ul>

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
        const taskToDelete = await loadTask(listId, taskId)
        if (!taskToDelete) throw new Error(`Could not find task '${taskId}' to delete.`)

        const boardColumnOfDeletedTask = taskToDelete.boardColumn
        const positionOfDeletedTask = taskToDelete.position

        await deleteTask(listId, taskId)
        await moveUpTasksBelowPosition(listId, boardColumnOfDeletedTask, positionOfDeletedTask)

        return json({ success: true, message: 'Task deleted successfully' })
      }

      case 'move': {
        const targetColumn = formData.get('targetColumn') as BoardColumn
        const taskToUpdate = await loadTask(listId, taskId)
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
        await updateBoardColumn(listId, updatedTask)

        // Move all tasks below the moved task up one position.
        await moveUpTasksBelowPosition(listId, boardColumnSoFar, positionSoFar)

        return json({ success: true, message: 'Task moved successfully' })
      }

      case 'reorder': {
        console.log(`[$listId.action] reorder start`)
        const targetTaskId = formData.get('targetTaskId') as string

        console.log(`[$listId.action] Swapping tasks ${listId}, ${taskId}, ${targetTaskId}`)
        await swapTasks(listId, taskId, targetTaskId)

        return json({ success: true, message: 'Task reordered successfully' })
      }

      default:
        return json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[$listId.action]', error)
    return json({ error: '[$listId.action] Failed to process action' }, { status: 500 })
  }
}
