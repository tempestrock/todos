import { ActionFunction, LoaderFunction, LoaderFunctionArgs, json, redirect } from '@remix-run/node'
import { Form, useNavigation, useNavigate, useSearchParams } from '@remix-run/react'
import { useEffect, useRef, useState } from 'react'

import Spinner from '~/components/Spinner'
import { useTranslation } from '~/contexts/TranslationContext'
import { BoardColumn, Task } from '~/types/dataTypes'
import { requireAuth } from '~/utils/auth/session.server'
import { saveTask } from '~/utils/database/saveAndUpdateData'
import { getNow } from '~/utils/dateAndTime'
import { getUid } from '~/utils/getUid'
import { pushTasksDown } from '~/utils/list/pushTasksDown'
import { printObject } from '~/utils/printObject'

export type LoaderData = unknown

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  console.log('[addTask.loader] starting')

  await requireAuth(request)

  return json<LoaderData>({})
}

export default function AddTaskView() {
  const [searchParams] = useSearchParams()
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDetails, setTaskDetails] = useState('')
  const navigation = useNavigation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const listId = searchParams.get('listId')
  if (!listId) throw new Error('[addTask.component] No list ID provided')

  const currentBoardColumn = searchParams.get('boardColumn') as BoardColumn

  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Directly put the cursor into the title field.
    if (titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl text-gray-900 dark:text-gray-100 font-semibold mb-4">{t['add-new-task']}</h2>

      <Form method="post">
        <input type="hidden" name="listId" value={listId} />
        <input type="hidden" name="boardColumn" value={currentBoardColumn} />

        <input
          ref={titleInputRef}
          type="text"
          name="taskTitle"
          placeholder="Task Title"
          className="w-full p-2 border rounded mb-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />

        <textarea
          name="taskDetails"
          placeholder="Task Details"
          className="w-full p-2 border rounded mb-4 h-48 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
          value={taskDetails}
          onChange={(e) => setTaskDetails(e.target.value)}
        />

        <div className="flex justify-end space-x-2">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-gray-100 px-4 py-2 rounded"
            disabled={navigation.state === 'submitting'}
          >
            {navigation.state === 'submitting' ? <Spinner size={24} lightModeColor="text-gray-100" /> : t['save']}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/${listId}`)}
            className={`text-gray-500 hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-700
              hover:bg-gray-200 dark:hover:bg-gray-300
              border border-gray-500 hover:border-gray-700 dark:border-gray-100
              px-4 py-2 rounded`}
          >
            {t['cancel']}
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
    labelIds: [],
  }

  console.log(`[addTask.action] listId: '${listId}'`)
  printObject(taskToAdd, `[addTask.action] new task`)

  // Push all tasks in the list down one position by incrementing their `position` values.
  await pushTasksDown(listId, boardColumn)

  // Save the new task.
  await saveTask(taskToAdd)

  return redirect(`/${listId}`)
}
