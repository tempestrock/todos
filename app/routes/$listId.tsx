import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLoaderData, useSubmit } from '@remix-run/react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

import { deleteTask } from '~/data/deleteTask'
import { loadTask } from '~/data/loadTask'
import { loadTaskList } from '~/data/loadTaskList'
import { updateBoardColumn } from '~/data/saveAndUpdateData'
import { Label, TaskList, BoardColumn, Task } from '~/types/dataTypes'
import { getNiceDateTime, getNow } from '~/utils/dateAndTime'
import { printObject } from '~/utils/printObject'
import { requireAuth } from '~/utils/session.server'

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
    return json<LoaderData>({ taskList, labels: [] })
  } catch (error) {
    console.error('[$listId.loader] Error loading tasks:', error)
    return json({ error: '[$listId.loader] Failed to load tasks' }, { status: 500 })
  }
}

export default function ListView() {
  const { taskList } = useLoaderData<LoaderData>()
  const submit = useSubmit()

  const boardColumns = Object.values(BoardColumn)
  const [currentBoardColumnIndex, setCurrentBoardColumnIndex] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

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
      submit({ intent: 'delete', taskId, listId: taskList.id }, { method: 'post' })
    }
  }

  const handleMove = (taskId: string, direction: 'prev' | 'next') => {
    const currentIndex = boardColumns.indexOf(currentBoardColumn)
    const newColumn = direction === 'prev' ? boardColumns[currentIndex - 1] : boardColumns[currentIndex + 1]

    submit({ intent: 'move', taskId, listId: taskList.id, newColumn }, { method: 'post' })
  }

  const currentBoardColumn = boardColumns[currentBoardColumnIndex]

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
          <Link to={`addTask?boardColumn=${currentBoardColumn}`} className="bg-green-500 text-white px-4 py-2 rounded">
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
          .map((task) => (
            <li key={task.id} className="border p-4 rounded">
              <div className="font-bold">{task.title}</div>
              <div className="text-sm text-gray-500">{getNiceDateTime(task.createdAt)}</div>

              {showDetails && (
                <div className="mt-2 text-gray-700 prose">
                  <ReactMarkdown>{task.details}</ReactMarkdown>
                </div>
              )}

              <div className="mt-2 space-x-4">
                <Link
                  to={`editTask/${task.id}?boardColumn=${currentBoardColumn}`}
                  className="text-blue-500 underline inline-block"
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
  const taskId = formData.get('taskId') as string
  const listId = formData.get('listId') as string

  try {
    switch (intent) {
      case 'delete':
        await deleteTask(listId, taskId)
        return json({ success: true, message: 'Task deleted successfully' })

      case 'move': {
        const newColumn = formData.get('newColumn') as BoardColumn
        const taskToUpdate = await loadTask(listId, taskId)
        if (!taskToUpdate) throw new Error(`Could not find task '${taskId}' to update.`)

        // Update the task with the new column
        const updatedTask: Task = {
          ...taskToUpdate,
          boardColumn: newColumn,
          updatedAt: getNow(),
        }

        await updateBoardColumn(listId, updatedTask)
        return json({ success: true, message: 'Task moved successfully' })
      }

      default:
        return json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[$listId.action]', error)
    return json({ error: '[$listId.action] Failed to process action' }, { status: 500 })
  }
}
