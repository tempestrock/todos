import { ActionFunction, LoaderFunction, json, redirect } from '@remix-run/node'
import { Form, useLoaderData, useNavigation, useParams, useNavigate } from '@remix-run/react'
import { useState, useEffect } from 'react'

import { addOrEditTask } from '~/data/addData'
import { TaskStatus } from '~/types/dataTypes'
import { printObject } from '~/utils/printObject'
import { requireAuth } from '~/utils/session.server'

export const loader: LoaderFunction = async ({ request, params }) => {
  printObject(request, '[$listId.add-edit.loader] request')
  printObject(params, '[$listId.add-edit.loader] params')

  const user = await requireAuth(request)
  const { taskId } = params

  if (taskId) {
    // Load existing task data if editing
    // const task = await getTaskById(taskId) // Implement this function
    const task = {
      id: '6',
      task: 'Buy eggs 6',
      status: TaskStatus.BACKLOG,
      listId: 'list-1',
      createdAt: '2024-09-13_09:05:00',
      labels: ['Urgent', 'Home'],
    }

    return json({ task, user })
  }

  return json({ user })
}

export default function AddEditTaskView() {
  const { task } = useLoaderData<{ task?: { id: string; task: string; status: TaskStatus } }>()

  printObject(task, '[$listId.add-edit.component] task')

  const params = useParams()
  const [taskText, setTaskText] = useState(task?.task || '')
  const navigation = useNavigation()
  const navigate = useNavigate()

  useEffect(() => {
    if (task) {
      setTaskText(task.task)
    }
  }, [task])

  const isEditing = !!params.taskId

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Task' : 'Add New Task'}</h2>

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
  const actionType = formData.get('action')
  console.log(`[$listId.add-edit.action] Action type ${actionType?.toString()}'.`)
  printObject(params, `[$listId.add-edit.action] params`)

  const { listId } = params
  const taskId = formData.get('taskId') as string
  const taskText = formData.get('taskText') as string
  const status = (formData.get('status') as TaskStatus) || TaskStatus.BACKLOG

  const task = {
    id: taskId || new Date().getTime().toString(),
    task: taskText,
    createdAt: new Date().toISOString(),
    listId: listId!,
    labels: [],
    status,
  }

  printObject(task, `[$listId.add-edit.action] task`)

  await addOrEditTask(listId!, task)

  return redirect(`/${listId}`)
}
