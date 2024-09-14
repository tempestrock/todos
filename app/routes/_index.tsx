import { ActionFunction, LoaderFunction, redirect } from '@remix-run/node'
import { Form, json, useLoaderData, useParams, Link, useSubmit, useNavigation } from '@remix-run/react'
import { useState, useEffect } from 'react'

import { addOrEditTask } from '~/data/addData'
import { loadAllTaskLists } from '~/data/loadAllTaskLists'
import { loadAllTasks } from '~/data/loadAllTasks'
// import { mockTodoLists } from '~/data/mockdata'
import { LoaderData } from '~/types/loaderData'
import { availableLabels, Label, TaskStatus } from '~/types/tasks'
import { authAction } from '~/utils/authActions'
import { printObject } from '~/utils/printObject'
import { requireAuth } from '~/utils/session.server'

 
export const loader: LoaderFunction = async ({ request, params: _params }) => {
  const user = await requireAuth(request)

  try {
    await loadAllTaskLists()
    const todoLists = await loadAllTasks()
    return json<LoaderData>({ todoLists, user, labels: availableLabels })
  } catch (error) {
    console.error('Error loading tasks:', error)
    return json({ error: 'Failed to load tasks' }, { status: 500 })
  }
}

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData()
  const actionType = formData.get('action')

  console.log('[action]: Starting. Action type:', actionType)

  // Handle authentication actions
  if (actionType === 'signin' || actionType === 'signout') {
    console.log('[action]: Handling authentication action')
    return authAction({ request, params, context: {} })
  }

  if (actionType === 'addTask' || actionType === 'editTask') {
    console.log(`[action]: Handling ${actionType} action`)
    const listId = formData.get('listId') as string
    const taskText = formData.get('taskText') as string
    const taskId = formData.get('taskId') as string

    const task = {
      id: taskId,
      task: taskText,
      createdAt: new Date().toISOString(),
      listId: listId,
      labels: [],
      status: actionType === 'addTask' ? TaskStatus.BACKLOG : (formData.get('status') as TaskStatus),
    }

    // TODO: Implement actual task addition/editing logic here
    await addOrEditTask(listId, task)

    console.log(`[action]: ${actionType} completed, redirecting`)
    return redirect(`/`)
    // return redirect(`/${listId}?t=${Date.now()}`)
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
  const { todoLists, labels: _labels, user: _user } = useLoaderData<LoaderData>()

  printObject(todoLists, '[Index]: todoLists')
  const params = useParams()
  // const [searchParams] = useSearchParams()
  // const listId = params.listId || searchParams.get('listId')

  const statuses = Object.values(TaskStatus)

  const submit = useSubmit()
  // const transition = useTransition()
  // const actionData = useActionData()
  const navigation = useNavigation()

  const [selectedListId, setSelectedListId] = useState<string | null>(params.listId || null)
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0)
  const [editTaskId, setEditTaskId] = useState<string | null>(null)
  const [newTaskText, setNewTaskText] = useState('')
  const [isAddingTask, setIsAddingTask] = useState(false)

  useEffect(() => {
    if (params.listId) {
      setSelectedListId(params.listId)
    }
  }, [params.listId])

  // const handleBackToListTitles = () => {
  //   setSelectedListId(null)
  // }

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

  const handleSaveTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    submit(form, { method: 'post', replace: true })
  }

  if (!selectedListId) {
    // Overall todo list view
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
            <Link
              key={list.id}
              to={`/${list.id}`}
              className="w-full text-white text-lg py-4 rounded block text-center"
              style={{ backgroundColor: list.color }}
            >
              {list.name}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const selectedList = todoLists.find((list) => list.id === selectedListId)
  const currentStatus = statuses[currentStatusIndex]

  if (editTaskId || isAddingTask) {
    // Edit and add task view
    return (
      <div className="container mx-auto p-4">
        <h2 className="text-xl font-semibold mb-4">{isAddingTask ? 'Add New Task' : 'Edit Task'}</h2>

        <Form method="post" onSubmit={handleSaveTask}>
          <input type="hidden" name="action" value={isAddingTask ? 'addTask' : 'editTask'} />
          <input type="hidden" name="listId" value={selectedListId} />
          <input type="hidden" name="taskId" value={editTaskId || new Date().getTime().toString()} />
          {!isAddingTask && <input type="hidden" name="status" value={currentStatus} />}

          <input
            type="text"
            name="taskText"
            className="w-full p-2 border rounded mb-4"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
          />

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-gray-500 border border-gray-500 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
              disabled={navigation.state === 'submitting'}
            >
              {navigation.state === 'submitting' ? 'Saving...' : 'Save'}
            </button>
          </div>
        </Form>
      </div>
    )
  }

  return (
    //  Task list view
    <div className="container mx-auto p-4">
      {/* Title bar */}
      <div className="flex justify-between items-center mb-4">
        <Link to="/" className="text-blue-500 underline">
          Back
        </Link>
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

      {/* Task list title */}
      <h2 className="text-xl font-semibold mb-4" style={{ color: selectedList?.color }}>
        {selectedList?.name} - {currentStatus}
      </h2>

      {/* Task list */}
      <ul className="space-y-4">
        {selectedList?.tasks
          .filter((task) => {
            console.log(`[filter] currentStatus: ${currentStatus}`)
            printObject(task, '[filter] task in list')
            return task.status === currentStatus
          })
          .map((task) => (
            <li key={task.id} className="border p-4 rounded" onClick={() => handleEditTask(task.id, task.task)}>
              <div className="font-bold">{task.task}</div>
              <div className="text-sm text-gray-500">{task.createdAt}</div>
              {/* <div className="mt-2">
                {task.labels.map((labelName) => (
                  <span
                    key={labelName}
                    className="inline-block px-2 py-1 text-xs font-medium rounded mr-2"
                    style={{ backgroundColor: getLabelColor(labelName, labels), color: 'white' }}
                  >
                    {labelName}
                  </span>
                ))}
              </div> */}
            </li>
          ))}
      </ul>
    </div>
  )
}
