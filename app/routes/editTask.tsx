import { ActionFunction, LoaderFunction, LoaderFunctionArgs, json, redirect } from '@remix-run/node'
import { Form, useLoaderData, useNavigation, useNavigate, useSearchParams } from '@remix-run/react'
import { useState, useEffect } from 'react'

import { loadTask } from '~/data/loadTask'
import { saveTask } from '~/data/saveAndUpdateData'
import { Task, BoardColumn, DateTimeString } from '~/types/dataTypes'
import { getNow } from '~/utils/dateAndTime'
import { printObject } from '~/utils/printObject'
import { requireAuth } from '~/utils/session.server'

type LoaderData = {
  task: Task
}

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  console.log('[editTask.loader] starting')
  printObject(request, '[editTask.loader] request')

  await requireAuth(request)
  const url = new URL(request.url)
  const listId = url.searchParams.get('listId')
  const taskId = url.searchParams.get('taskId')

  if (!listId) throw new Error('[editTask.loader] No list ID provided')
  if (!taskId) throw new Error('[editTask.loader] No task ID provided')

  const task = await loadTask(listId, taskId)
  if (!task) throw new Error('[editTask.loader] Failed to load task')

  return json<LoaderData>({ task })
}

export default function EditTaskView() {
  const { task } = useLoaderData<LoaderData>()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const [taskTitle, setTaskTitle] = useState(task?.title || '')
  const [taskDetails, setTaskDetails] = useState(task?.details || '')
  const [searchParams] = useSearchParams()
  const currentBoardColumn = searchParams.get('boardColumn') as BoardColumn
  const listId = searchParams.get('listId')
  if (!listId) throw new Error('[editTask.component] No list ID provided')

  useEffect(() => {
    if (task) {
      setTaskTitle(task.title)
      setTaskDetails(task.details)
    }
  }, [task])

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Edit Task</h2>

      <Form method="post">
        <input type="hidden" name="listId" value={listId} />
        <input type="hidden" name="taskId" value={task.id} />
        <input type="hidden" name="boardColumn" value={currentBoardColumn} />
        <input type="hidden" name="position" value={task.position} />
        <input type="hidden" name="createdAt" value={task.createdAt} />

        <input
          type="text"
          name="taskTitle"
          placeholder="Task Title"
          className="w-full p-2 border rounded mb-4"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />

        <textarea
          name="taskDetails"
          placeholder="Task Details"
          className="w-full p-2 border rounded mb-4 h-32"
          value={taskDetails}
          onChange={(e) => setTaskDetails(e.target.value)}
        />

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => navigate(`/${listId}`)}
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

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const listId = formData.get('listId') as string
  const taskId = formData.get('taskId') as string
  const taskTitle = formData.get('taskTitle') as string
  const taskDetails = formData.get('taskDetails') as string
  const boardColumn = formData.get('boardColumn') as BoardColumn
  const createdAt = formData.get('createdAt') as DateTimeString

  const positionAsString = formData.get('position') as string | null
  if (!positionAsString) throw new Error('[editTask.action] No position provided')
  const position = parseInt(positionAsString)

  if (!listId) throw new Error('[editTask.action] No list ID provided')
  if (!taskId) throw new Error('[editTask.action] No task ID provided')

  // Build up the updated task object.
  const task: Task = {
    id: taskId,
    title: taskTitle,
    details: taskDetails,
    position,
    boardColumn,
    listId,
    createdAt,
    updatedAt: getNow(),
    labels: [],
  }

  printObject(task, `[editTask.action] updated task`)
  console.log(`[editTask.action] listId: '${listId}'`)

  await saveTask(listId, task)

  return redirect(`/${listId}`)
}