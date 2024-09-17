import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLoaderData, useSubmit } from '@remix-run/react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

import { deleteTask } from '~/data/deleteTask'
import { loadTaskList } from '~/data/loadTaskList'
import { Label, TaskList, BoardColumn } from '~/types/dataTypes'
import { getNiceDateTime } from '~/utils/dateAndTime'
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
  // Get the necessary data from the loader.
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
      submit({ taskId, listId: taskList.id }, { method: 'delete' })
    }
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
              </div>
            </li>
          ))}
      </ul>

      <Outlet />
    </div>
  )
}

/**
 * Handles the action for the task deletion.
 *
 * @param {{ request: Request }} params - An object containing the request.
 * @return {Promise<json>} A JSON response indicating the success of the deletion.
 */
export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData()
  const listId = formData.get('listId') as string
  const taskId = formData.get('taskId') as string

  console.log(`Deleting task '${taskId}' from list '${listId}'.`)

  await deleteTask(listId, taskId)

  return json({ success: true })
}
