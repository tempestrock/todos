// import Index from './_index'

// export { loader, action } from './_index'
// export default Index

import { ActionFunction, json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData, useParams } from '@remix-run/react'
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

  // return json({ message: `This is list '${params.listId}'.` })
}

export default function ListView() {
  // Get the necessary data from the loader.
  const { todoLists } = useLoaderData<LoaderData>()

  const params = useParams()
  // const [searchParams] = useSearchParams()
  // const listId = params.listId // || searchParams.get('listId')

  const statuses = Object.values(TaskStatus)

  // const submit = useSubmit()
  // const transition = useTransition()
  // const actionData = useActionData()
  // const navigation = useNavigation()

  // const [selectedListId, setSelectedListId] = useState<string>(params.listId!)
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0)
  // const [editTaskId, setEditTaskId] = useState<string | null>(null)

  // const [newTaskText, setNewTaskText] = useState('')
  // const [isAddingTask, setIsAddingTask] = useState(false)

  // useEffect(() => {
  //   if (params.listId) {
  //     setSelectedListId(params.listId)
  //   }
  // }, [params.listId])

  // const handleBackToListTitles = () => {
  //   setSelectedListId(null)
  // }

  const handlePrevStatus = () => {
    if (currentStatusIndex > 0) setCurrentStatusIndex(currentStatusIndex - 1)
  }

  const handleNextStatus = () => {
    if (currentStatusIndex < statuses.length - 1) setCurrentStatusIndex(currentStatusIndex + 1)
  }

  // const handleEditTask = (taskId: string, taskText: string) => {
  //   setEditTaskId(taskId)
  //   setNewTaskText(taskText)
  // }

  // const handleAddTask = () => {
  //   setIsAddingTask(true)
  //   setNewTaskText('')
  // }

  // const handleCancelEdit = () => {
  //   setEditTaskId(null)
  //   setIsAddingTask(false)
  // }

  // const handleSaveTask = (event: React.FormEvent<HTMLFormElement>) => {
  //   event.preventDefault()
  //   const form = event.currentTarget
  //   submit(form, { method: 'post', replace: true })
  // }

  const selectedList = todoLists.find((list) => list.id === params.listId)
  const currentStatus = statuses[currentStatusIndex]

  return (
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
          <Link to={`/${params.listId}/add-edit`} className="bg-green-500 text-white px-4 py-2 rounded">
            Add
          </Link>
        </div>
      </div>

      {/* Task list title */}
      <h2 className="text-xl font-semibold mb-4" style={{ color: selectedList?.color }}>
        {selectedList?.name} - {currentStatus}
      </h2>

      {/* Task list */}
      <ul className="space-y-4">
        {selectedList?.tasks
          .filter((task) => task.status === currentStatus)
          .map((task) => (
            <li key={task.id} className="border p-4 rounded">
              <div className="font-bold">{task.task}</div>
              <div className="text-sm text-gray-500">{task.createdAt}</div>
              <Link to={`/${params.listId}/add-edit/${task.id}`} className="text-blue-500 underline mt-2 inline-block">
                Edit
              </Link>
            </li>
          ))}
      </ul>
    </div>
  )
}

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData()
  const actionType = formData.get('action')
  console.log(`[$listId.action] Action type ${actionType?.toString()}'.`)
  printObject(params, `[$listId.action] params`)

  //   // Handle authentication actions
  //   if (actionType === 'signin' || actionType === 'signout') {
  //     console.log('[action]: Handling authentication action')
  //     return authAction({ request, params, context: {} })
  //   }

  //   if (actionType === 'addTask' || actionType === 'editTask') {
  //     console.log(`[action]: Handling ${actionType} action`)
  //     const listId = formData.get('listId') as string
  //     const taskText = formData.get('taskText') as string
  //     const taskId = formData.get('taskId') as string

  //     const task = {
  //       id: taskId,
  //       task: taskText,
  //       createdAt: new Date().toISOString(),
  //       listId: listId,
  //       labels: [],
  //       status: actionType === 'addTask' ? TaskStatus.BACKLOG : (formData.get('status') as TaskStatus),
  //     }

  //     await addOrEditTask(listId, task)

  //     console.log(`[action]: ${actionType} completed, redirecting`)
  return redirect(`/`)
  //     // return redirect(`/${listId}?t=${Date.now()}`)
  //   }

  //   // Handle other actions here...

  //   console.log('[action]: No matching action type')
  //   return null
}
