import { ActionFunction, LoaderFunction, LoaderFunctionArgs, json, redirect } from '@remix-run/node'
import { Form, useLoaderData, useNavigation, useParams, useNavigate, useSearchParams } from '@remix-run/react'
import { useState } from 'react'

import { saveTask } from '~/data/saveAndUpdateData'
import { BoardColumn, Task } from '~/types/dataTypes'
import { getNow } from '~/utils/getNow'
import { getUid } from '~/utils/getUid'
import { printObject } from '~/utils/printObject'
import { requireAuth } from '~/utils/session.server'

export type LoaderData = unknown

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  console.log('[$listId.addTask.loader] starting')
  printObject(request, '[$listId.addTask.loader] request')
  printObject(params, '[$listId.addTask.loader] params')

  await requireAuth(request)

  return json<LoaderData>({})
}

export default function AddEditTaskView() {
  useLoaderData<LoaderData>()

  console.log('[$listId.addTask.component] starting')

  const params = useParams()
  const [searchParams] = useSearchParams()
  const [taskText, setTaskText] = useState('')
  const navigation = useNavigation()
  const navigate = useNavigate()

  const currentBoardColumn = (searchParams.get('boardColumn') as BoardColumn) || BoardColumn.BACKLOG
  printObject(params, '[$listId.addTask.component] params')

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">'Add New Task'</h2>

      <Form method="post">
        <input type="hidden" name="boardColumn" value={currentBoardColumn} />

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
  console.log(`[$listId.addTask.action] Action type ${actionType?.toString()}'.`)
  printObject(params, `[$listId.addTask.action] params`)

  const { listId } = params
  const taskTitle = formData.get('taskText') as string
  const boardColumn = (formData.get('boardColumn') as BoardColumn) || BoardColumn.BACKLOG
  const nowStr = getNow()

  // Build the updated task object.
  const task: Task = {
    id: getUid(),
    title: taskTitle,
    details: '',
    boardColumn: boardColumn,
    listId: listId!,
    createdAt: nowStr,
    updatedAt: nowStr,
    labels: [],
  }

  printObject(task, `[$listId.addTask.action] new task`)
  console.log(`[$listId.addTask.action] listId: '${listId}'`)

  await saveTask(listId!, task)

  return redirect(`/${listId}`)
}
