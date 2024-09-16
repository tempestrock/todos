import { ActionFunction, LoaderFunction, json, redirect } from '@remix-run/node'
import { Form, useLoaderData, useNavigation, useParams, useNavigate } from '@remix-run/react'
import { useState, useEffect } from 'react'

import { addOrEditTask } from '~/data/addData'
import { TaskStatus, User } from '~/types/dataTypes'
import { requireAuth } from '~/utils/session.server'

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireAuth(request)
  const { taskId } = params

  if (!taskId) throw new Error('[$listId.editTask.action] No task ID provided')

  // const task = await getTaskById(taskId)
  const task = {
    id: '6',
    title: 'Buy eggs 6',
    status: TaskStatus.BACKLOG,
    listId: 'list-1',
    createdAt: '2024-09-13_09:05:00',
    labels: ['Urgent', 'Home'],
  }

  return json({ task, user })
}

export default function EditTaskView() {
  const { task } = useLoaderData<{ task?: { id: string; task: string; status: TaskStatus }; user: User }>()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const params = useParams()
  const [taskText, setTaskText] = useState(task?.task || '')

  useEffect(() => {
    if (task) {
      setTaskText(task.task)
    }
  }, [task])

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Edit Task</h2>

      <Form method="post">
        <input type="hidden" name="status" value={task?.status || TaskStatus.BACKLOG} />

        <input
          type="text"
          name="taskText"
          className="w-full p-2 border rounded mb-4"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
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
  const taskText = formData.get('taskText') as string
  const status = formData.get('status') as TaskStatus

  const task = {
    id: taskId!,
    title: taskText,
    createdAt: '2024-09-13_09:05:00',
    listId: listId!,
    labels: ['Urgent', 'Home'],
    status,
  }

  await addOrEditTask(listId!, task)

  return redirect(`/${listId}`)
}
