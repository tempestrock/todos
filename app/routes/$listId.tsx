import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLoaderData, useParams } from '@remix-run/react'
import { useState } from 'react'

import { loadAllTasks } from '~/data/loadAllTasks'
import { TaskStatus } from '~/types/dataTypes'
import { LoaderData } from '~/types/loaderData'
import { printObject } from '~/utils/printObject'
import { requireAuth } from '~/utils/session.server'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  printObject(request, '[$listId.loader] request')
  printObject(params, '[$listId.loader] params')

  const user = await requireAuth(request)

  try {
    const todoLists = await loadAllTasks()
    return json<LoaderData>({ todoLists, user, labels: [] })
  } catch (error) {
    console.error('Error loading tasks:', error)
    return json({ error: 'Failed to load tasks' }, { status: 500 })
  }
}

export default function ListView() {
  // Get the necessary data from the loader.
  const { todoLists } = useLoaderData<LoaderData>()

  const params = useParams()
  const boardColumns = Object.values(TaskStatus)

  const [currentBoardColumnIndex, setCurrentBoardColumnIndex] = useState(0)

  const handlePrevBoardColumn = () => {
    if (currentBoardColumnIndex > 0) setCurrentBoardColumnIndex(currentBoardColumnIndex - 1)
  }

  const handleNextBoardColumn = () => {
    if (currentBoardColumnIndex < boardColumns.length - 1) setCurrentBoardColumnIndex(currentBoardColumnIndex + 1)
  }

  const selectedList = todoLists.find((list) => list.id === params.listId)
  const currentBoardColumn = boardColumns[currentBoardColumnIndex]

  return (
    <div className="container mx-auto p-4">
      {/* Title bar */}
      <div className="flex justify-between items-center mb-4">
        <Link to="/" className="text-blue-500 underline">
          Back
        </Link>
        <div className="flex gap-4">
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
          <Link to="addTask" className="bg-green-500 text-white px-4 py-2 rounded">
            Add
          </Link>
        </div>
      </div>

      {/* Task list title */}
      <h2 className="text-xl font-semibold mb-4" style={{ color: selectedList?.color }}>
        {selectedList?.name} - {currentBoardColumn}
      </h2>

      {/* Task list */}
      <ul className="space-y-4">
        {selectedList?.tasks
          .filter((task) => task.status === currentBoardColumn)
          .map((task) => (
            <li key={task.id} className="border p-4 rounded">
              <div className="font-bold">{task.title}</div>
              <div className="text-sm text-gray-500">{task.createdAt}</div>
              <Link to={`editTask/${task.id}`} className="text-blue-500 underline mt-2 inline-block">
                Edit
              </Link>
            </li>
          ))}
      </ul>

      <Outlet />
    </div>
  )
}

// export const action: ActionFunction = async ({ request, params }) => {
//   const formData = await request.formData()
//   const actionType = formData.get('action')
//   console.log(`[$listId.action] Action type ${actionType?.toString()}'.`)
//   printObject(params, `[$listId.action] params`)

//   return redirect(`/`)
// }
