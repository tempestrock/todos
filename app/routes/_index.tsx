import { ActionFunction, ActionFunctionArgs, LoaderFunction, redirect } from '@remix-run/node'
import { Form, json, useLoaderData } from '@remix-run/react'
import { useState } from 'react'

import { addTask } from '~/data/addData'
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


export const action: ActionFunction = async ({ request, params, context }: ActionFunctionArgs) => {
  const clonedRequest = request.clone()
  const formData = await clonedRequest.formData()
  const actionType = formData.get('action')

  console.log('[action]: Starting. Action type:', actionType)

  // Handle authentication actions
  if (actionType === 'signin' || actionType === 'signout') {
    console.log('[action]: Handling authentication action')
    return authAction({ request, params, context })
  }

  // Handle task-related actions
  if (actionType === 'addTask') {
    console.log('[action]: Handling addTask action')
    const listId = formData.get('listId') as string
    const taskText = formData.get('taskText') as string
    const taskId = formData.get('taskId') as string

    const task = {
      id: taskId,
      task: taskText,
      createdAt: new Date().toISOString(),
      status: 'backlog' as TaskStatus,
    }

    // await addTask(listId, task)

    return redirect('/')
  }

  // Handle other actions here...

  console.log('[action]: No matching action type')
  return null
}

const getLabelColor = (labelName: string, availableLabels: Label[]): string => {
  const label = availableLabels.find((label) => label.name === labelName)
  return label ? label.color : 'gray'
}

export default function Index() {
  const { todoLists, labels } = useLoaderData<LoaderData>()
  const statuses = Object.values(TaskStatus)

  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0)
  const [editTaskId, setEditTaskId] = useState<string | null>(null)
  const [newTaskText, setNewTaskText] = useState('')
  const [isAddingTask, setIsAddingTask] = useState(false)

  const handleListSelect = (listId: string) => {
    setSelectedListId(listId)
    setCurrentStatusIndex(0)
    setEditTaskId(null)
    setIsAddingTask(false)
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

  const handleEditTask = (taskId: string, taskText: string) => {
    setEditTaskId(taskId)
    setNewTaskText(taskText)
  }

  const handleAddTask = () => {
    setIsAddingTask(true)
    setNewTaskText('')
  }

  const handleCancelEdit = () => {
    setEditTaskId(null)
    setIsAddingTask(false)
  }

  const handleSaveTask = () => {
    // Logic for saving the task (either edit or add new)
    setEditTaskId(null)
    setIsAddingTask(false)
    // Note: You would typically update the state here, but since the data is mocked, it won't persist
  }

  if (!selectedListId) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          <h1 className="text-2xl font-bold mb-4">My To-Do Lists</h1>
          <Form method="post">
            <input type="hidden" name="action" value="signout" />
            <button className="text-xs border border-gray-700 mt-1 bg-gray-100 pt-1 px-2 pb-1" type="submit">
              Sign out
            </button>
          </Form>
        </div>

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

  if (editTaskId || isAddingTask) {
    return (
      <div className="container mx-auto p-4">
        <h2 className="text-xl font-semibold mb-4">{isAddingTask ? 'Add New Task' : 'Edit Task'}</h2>

        <Form method="post">
          <input type="hidden" name="action" value={isAddingTask ? 'addTask' : 'editTask'} />
          <input type="hidden" name="listId" value={selectedListId} />
          <input type="hidden" name="taskId" value={editTaskId || new Date().getTime().toString()} />

          <input
            type="text"
            name="taskText"
            className="w-full p-2 border rounded mb-4"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
          />

          <div className="flex justify-end space-x-2">
            <button onClick={handleCancelEdit} className="text-gray-500 border border-gray-500 px-4 py-2 rounded">
              Cancel
            </button>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Save
            </button>
          </div>
        </Form>
      </div>
    )
  }

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
          <button onClick={handleAddTask} className="bg-green-500 text-white px-4 py-2 rounded">
            Add
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
            <li key={task.id} className="border p-4 rounded" onClick={() => handleEditTask(task.id, task.task)}>
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
