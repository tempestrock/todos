import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLoaderData, useSubmit } from '@remix-run/react'
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
  const [showDetails, setShowDetails] = useState(false)
  const currentBoardColumn = boardColumns[currentBoardColumnIndex]

  const handlePrevBoardColumn = () => {
    if (currentBoardColumnIndex > 0) setCurrentBoardColumnIndex(currentBoardColumnIndex - 1)
  }

  const handleNextBoardColumn = () => {
    if (currentBoardColumnIndex < boardColumns.length - 1) setCurrentBoardColumnIndex(currentBoardColumnIndex + 1)
  }

  const toggleDetails = () => {
    setShowDetails((prev) => !prev)
  }

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
        <Link to="/" className="text-blue-500 underline">
          Back
        </Link>
        <div className="flex gap-4">
          {/* Toggle Details Button */}
          <button onClick={toggleDetails} className="bg-blue-500 text-white px-4 py-2 rounded">
            {showDetails ? 'Hide details' : 'Show details'}
          </button>

          <button
            onClick={handlePrevBoardColumn}
            className={`text-gray-500 ${currentBoardColumnIndex === 0 ? 'opacity-50' : ''}`}
            disabled={currentBoardColumnIndex === 0}
          >
            Left
          </button>
          <button
            onClick={handleNextBoardColumn}
            className={`text-gray-500 ${currentBoardColumnIndex === boardColumns.length - 1 ? 'opacity-50' : ''}`}
            disabled={currentBoardColumnIndex === boardColumns.length - 1}
          >
            Right
          </button>
          <Link
            to={`/addTask?listId=${listId}&boardColumn=${currentBoardColumn}`}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add
          </Link>
        </div>
      </div>

      {/* Task list title */}
      <h2 className="text-xl font-semibold mb-4" style={{ color: taskList?.color }}>
        {taskList?.displayName} - {currentBoardColumn}
      </h2>

      {/* Task list */}
      <ul className="space-y-4">
        {taskList?.tasks
          .filter((task) => task.boardColumn === currentBoardColumn)
          .map((task, index, tasksInCurrentColumn) => (
            <li key={task.id} className="border p-4 rounded">
              <div className="font-bold">{task.title}</div>
              <div className="text-sm text-gray-500">{getNiceDateTime(task.createdAt)}</div>

              {showDetails && (
                <div className="mt-2 text-gray-700 prose">
                  <ReactMarkdown>{task.details}</ReactMarkdown>
                </div>
              )}

              <div className="mt-2 space-x-4">
                {/* <Link
                  to={`editTask/${task.id}?boardColumn=${currentBoardColumn}`}
                  className="text-blue-500 underline inline-block"
                >
                  Edit
                </Link> */}

                <Link
                  to={`/editTask?listId=${listId}&taskId=${task.id}&boardColumn=${currentBoardColumn}`}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Edit
                </Link>
                <button onClick={() => handleDelete(task.id)} className="text-red-500 underline inline-block">
                  Delete
                </button>

                {currentBoardColumnIndex > 0 && (
                  <button onClick={() => handleMove(task.id, 'prev')} className="text-green-500 underline inline-block">
                    &larr; {boardColumns[currentBoardColumnIndex - 1]}
                  </button>
                )}

                {currentBoardColumnIndex < boardColumns.length - 1 && (
                  <button onClick={() => handleMove(task.id, 'next')} className="text-green-500 underline inline-block">
                    {boardColumns[currentBoardColumnIndex + 1]} &rarr;
                  </button>
                )}

                <button
                  onClick={() => handleReorder(task.id, 'up')}
                  className={`text-blue-500 underline inline-block ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={index === 0}
                >
                  Up
                </button>

                <button
                  onClick={() => handleReorder(task.id, 'down')}
                  className={`text-blue-500 underline inline-block ${index === tasksInCurrentColumn.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={index === tasksInCurrentColumn.length - 1}
                >
                  Down
                </button>
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
