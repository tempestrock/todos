import { ActionFunction, LoaderFunction, LoaderFunctionArgs, json, redirect } from '@remix-run/node'
import { Form, useLoaderData, useNavigation, useParams, useNavigate, useSearchParams } from '@remix-run/react'
import { useState, useEffect } from 'react'

import { loadTask } from '~/data/loadTask'
import { saveTask } from '~/data/saveTask'
import { Task, TaskStatus, User } from '~/types/dataTypes'
import { printObject } from '~/utils/printObject'
import { requireAuth } from '~/utils/session.server'

type LoaderData = {
  user: User | null
  task: Task
}

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  console.log('[$listId.editTask.loader] starting')
  printObject(request, '[$listId.editTask.loader] request')
  printObject(params, '[$listId.editTask.loader] params')

  const user = await requireAuth(request)
  const { listId, taskId } = params

  if (!listId) throw new Error('[$listId.editTask.action] No list ID provided')
  if (!taskId) throw new Error('[$listId.editTask.action] No task ID provided')

  const task = await loadTask(listId,taskId)
  if (!task) throw new Error('[$listId.editTask.action] Failed to load task')

  return json<LoaderData>({ task, user })
}

export default function EditTaskView() {
  const { task } = useLoaderData<LoaderData>()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const params = useParams()
  const [taskTitle, setTaskTitle] = useState(task?.title || '')
  const [searchParams] = useSearchParams()
  const currentBoardColumn = (searchParams.get('boardColumn') as TaskStatus) || TaskStatus.BACKLOG

  useEffect(() => {
    if (task) {
      setTaskTitle(task.title)
    }
  }, [task])

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Edit Task</h2>

      <Form method="post">
        <input type="hidden" name="boardColumn" value={currentBoardColumn} />

        <input
          type="text"
          name="taskTitle"
          className="w-full p-2 border rounded mb-4"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => navigate(`/${params.listId}`)}
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

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData()
  const { listId, taskId } = params
  const taskTitle = formData.get('taskTitle') as string
  const boardColumn = formData.get('boardColumn') as TaskStatus

  const task = {
    id: taskId!,
    title: taskTitle,
    createdAt: '2024-09-13_09:05:00',
    listId: listId!,
    labels: ['Urgent', 'Home'],
    status: boardColumn,
  }

  printObject(task, `[$listId.editTask.action] task`)
  console.log(`[$listId.editTask.action] listId: '${listId}'`)

  await saveTask(listId!, task)

  return redirect(`/${listId}`)
}
