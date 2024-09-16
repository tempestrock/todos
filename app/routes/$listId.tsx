// import Index from './_index'

// export { loader, action } from './_index'
// export default Index

import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData, useNavigation, useParams, useSubmit } from '@remix-run/react'
import { useEffect, useState } from 'react'

import { loadAllTasks } from '~/data/loadAllTasks'
import { TaskStatus } from '~/types/dataTypes'
import { LoaderData } from '~/types/loaderData'
import { requireAuth } from '~/utils/session.server'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  console.log(`[$listId.loader] params.listId: ${params.listId}`)

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

    const [selectedListId, setSelectedListId] = useState<string | null>(params.listId || null)
    const [currentStatusIndex, setCurrentStatusIndex] = useState(0)
    // const [editTaskId, setEditTaskId] = useState<string | null>(null)
    // const [newTaskText, setNewTaskText] = useState('')
    // const [isAddingTask, setIsAddingTask] = useState(false)

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

    const selectedList = todoLists.find((list) => list.id === selectedListId)
    const currentStatus = statuses[currentStatusIndex]

  //   if (editTaskId || isAddingTask) {
  //     // Edit and add task view
  //     return (
  //       <div className="container mx-auto p-4">
  //         <h2 className="text-xl font-semibold mb-4">{isAddingTask ? 'Add New Task' : 'Edit Task'}</h2>

  //         <Form method="post" onSubmit={handleSaveTask}>
  //           <input type="hidden" name="action" value={isAddingTask ? 'addTask' : 'editTask'} />
  //           <input type="hidden" name="listId" value={selectedListId} />
  //           <input type="hidden" name="taskId" value={editTaskId || new Date().getTime().toString()} />
  //           {!isAddingTask && <input type="hidden" name="status" value={currentStatus} />}

  //           <input
  //             type="text"
  //             name="taskText"
  //             className="w-full p-2 border rounded mb-4"
  //             value={newTaskText}
  //             onChange={(e) => setNewTaskText(e.target.value)}
  //           />

  //           <div className="flex justify-end space-x-2">
  //             <button
  //               type="button"
  //               onClick={handleCancelEdit}
  //               className="text-gray-500 border border-gray-500 px-4 py-2 rounded"
  //             >
  //               Cancel
  //             </button>
  //             <button
  //               type="submit"
  //               className="bg-blue-500 text-white px-4 py-2 rounded"
  //               disabled={navigation.state === 'submitting'}
  //             >
  //               {navigation.state === 'submitting' ? 'Saving...' : 'Save'}
  //             </button>
  //           </div>
  //         </Form>
  //       </div>
  //     )
  //   }

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
            {/* <button onClick={handleAddTask} className="bg-green-500 text-white px-4 py-2 rounded">
              Add
            </button> */}
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
              // <li key={task.id} className="border p-4 rounded" onClick={() => handleEditTask(task.id, task.task)}>
              <li key={task.id} className="border p-4 rounded">
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

//   return (
//     <ul>
//       <li>Number of todos: {loaderData.todoLists.length}</li>
//     </ul>
//   )
// }

// export const action: ActionFunction = async ({ request, params }) => {
//   const formData = await request.formData()
//   const actionType = formData.get('action')

//   console.log('[action]: Starting. Action type:', actionType)

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
//     return redirect(`/`)
//     // return redirect(`/${listId}?t=${Date.now()}`)
//   }

//   // Handle other actions here...

//   console.log('[action]: No matching action type')
//   return null
// }
