import { LoaderFunction } from '@remix-run/node'
import { json, useLoaderData } from '@remix-run/react'
import { useState } from 'react'

import { availableLabels, Label, mockTodoLists, TaskStatus } from '~/data/mockdata'
import { LoaderData } from '~/types/loaderData'
import { authAction } from '~/utils/authActions'
import { requireAuth } from '~/utils/session.server'

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireAuth(request)
  return json<LoaderData>({
    user,
    todoLists: mockTodoLists,
    labels: availableLabels,
  })
}

const getLabelColor = (labelName: string, availableLabels: Label[]): string => {
  const label = availableLabels.find((label) => label.name === labelName)
  return label ? label.color : 'gray'
}

export const action = authAction

export default function Index() {
  const { todoLists, labels } = useLoaderData<LoaderData>()
  const statuses = Object.values(TaskStatus)

  // State to manage which list is selected
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0)

  const handleListSelect = (listId: string) => {
    setSelectedListId(listId)
    setCurrentStatusIndex(0)
  }

  const handleBackToListTitles = () => {
    setSelectedListId(null)
  }

  const handlePrevStatus = () => {
    if (currentStatusIndex > 0) setCurrentStatusIndex(currentStatusIndex - 1)
  }

  const handleNextStatus = () => {
    if (currentStatusIndex < statuses.length - 1) setCurrentStatusIndex(currentStatusIndex + 1)
  }

  if (!selectedListId) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">My To-Do Lists</h1>
        <div className="grid grid-cols-1 gap-4">
          {todoLists.map((list) => (
            <button
              key={list.id}
              onClick={() => handleListSelect(list.id)}
              className="w-full text-white text-lg py-4 rounded"
              style={{ backgroundColor: list.color }}
            >
              {list.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const selectedList = todoLists.find((list) => list.id === selectedListId)
  const currentStatus = statuses[currentStatusIndex]

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handleBackToListTitles} className="text-blue-500 underline">
          Back
        </button>
        <div className="flex gap-4">
          <button
            onClick={handlePrevStatus}
            className={`text-gray-500 ${currentStatusIndex === 0 ? 'opacity-50' : ''}`}
            disabled={currentStatusIndex === 0}
          >
            Left
          </button>
          <button
            onClick={handleNextStatus}
            className={`text-gray-500 ${currentStatusIndex === statuses.length - 1 ? 'opacity-50' : ''}`}
            disabled={currentStatusIndex === statuses.length - 1}
          >
            Right
          </button>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4" style={{ color: selectedList?.color }}>
        {selectedList?.name} - {currentStatus}
      </h2>

      <ul className="space-y-4">
        {selectedList?.tasks
          .filter((task) => task.status === currentStatus)
          .map((task) => (
            <li key={task.id} className="border p-4 rounded">
              <div className="font-bold">{task.task}</div>
              <div className="text-sm text-gray-500">{task.createdAt}</div>
              <div className="mt-2">
                {task.labels.map((labelName) => (
                  <span
                    key={labelName}
                    className="inline-block px-2 py-1 text-xs font-medium rounded mr-2"
                    style={{ backgroundColor: getLabelColor(labelName, labels), color: 'white' }}
                  >
                    {labelName}
                  </span>
                ))}
              </div>
            </li>
          ))}
      </ul>
    </div>
  )
}
