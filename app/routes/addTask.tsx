import { ActionFunction, LoaderFunction, LoaderFunctionArgs, json, redirect } from '@remix-run/node'
import { Form, useLoaderData, useNavigation, useNavigate, useSearchParams } from '@remix-run/react'
import { useState } from 'react'

import { saveTask } from '~/data/saveAndUpdateData'
import { pushTasksDown } from '~/listUtils/pushTasksDown'
import { BoardColumn, Task } from '~/types/dataTypes'
import { getNow } from '~/utils/dateAndTime'
import { getUid } from '~/utils/getUid'
import { printObject } from '~/utils/printObject'
import { requireAuth } from '~/utils/session.server'

export type LoaderData = unknown

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  console.log('[addTask.loader] starting')
  printObject(request, '[addTask.loader] request')
  printObject(params, '[addTask.loader] params')

  await requireAuth(request)

  return json<LoaderData>({})
}

export default function AddTaskView() {
  useLoaderData<LoaderData>()

  console.log('[addTask.component] starting')

  const [searchParams] = useSearchParams()
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDetails, setTaskDetails] = useState('')
  const navigation = useNavigation()
  const navigate = useNavigate()

  const listId = searchParams.get('listId')
  if (!listId) throw new Error('[addTask.component] No list ID provided')

  const currentBoardColumn = searchParams.get('boardColumn') as BoardColumn

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Add New Task</h2>

      <Form method="post">
        <input type="hidden" name="listId" value={listId} />
        <input type="hidden" name="boardColumn" value={currentBoardColumn} />

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
  if (!listId) throw new Error(`[addTask.action] listId not found.`)

  const taskTitle = formData.get('taskTitle') as string
  const taskDetails = formData.get('taskDetails') as string
  const boardColumn = formData.get('boardColumn') as BoardColumn
  const nowStr = getNow()

  // Build the updated task object.
  const taskToAdd: Task = {
    id: getUid(),
    title: taskTitle,
    details: taskDetails,
    position: 0, // Put the new task at the top of the list.
    boardColumn,
    listId,
    createdAt: nowStr,
    updatedAt: nowStr,
    labels: [],
  }

  printObject(taskToAdd, `[addTask.action] new task`)
  console.log(`[addTask.action] listId: '${listId}'`)

  // Push all tasks in the list down one position by incrementing their `position` values.
  await pushTasksDown(listId, boardColumn)

  // Save the new task.
  await saveTask(listId, taskToAdd)

  return redirect(`/${listId}`)
}
