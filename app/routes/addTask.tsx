import { ActionFunction, LoaderFunction, LoaderFunctionArgs, json, redirect } from '@remix-run/node'
import { Form, useLoaderData, useNavigation, useNavigate, useSearchParams } from '@remix-run/react'
import { useEffect, useRef, useState } from 'react'

import LabelHandlingOnTaskPage from '~/components/LabelHandlingOnTaskPage'
import Spinner from '~/components/Spinner'
import { useTranslation } from '~/contexts/TranslationContext'
import { BoardColumn, Task, Label } from '~/types/dataTypes'
import { requireAuth } from '~/utils/auth/requireAuth'
import { loadAllLabels, saveLabel } from '~/utils/database/labelOperations'
import { saveTask } from '~/utils/database/taskOperations'
import { getNow } from '~/utils/dateAndTime'
import { getUid } from '~/utils/getUid'
import { LANG_DEFAULT } from '~/utils/language'
import { pushTasksDown } from '~/utils/list/pushTasksDown'
import { log } from '~/utils/log'
import { printObject } from '~/utils/printObject'

type LoaderData = {
  labels: Label[]
}

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const authResult = await requireAuth(request)

  // Load all labels
  const labels = await loadAllLabels()

  return json<LoaderData>({ labels }, { headers: authResult.headers })
}

export default function AddTaskView() {
  const { labels } = useLoaderData<LoaderData>()
  const [searchParams] = useSearchParams()
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDetails, setTaskDetails] = useState('')
  const [taskLabelIds, setTaskLabelIds] = useState<string[]>([])
  const navigation = useNavigation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const lang = typeof window !== 'undefined' ? localStorage.getItem('lang') || LANG_DEFAULT : LANG_DEFAULT

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
      <Form method="post">
        <div className="flex justify-between mb-4">
          <div className="text-2xl text-gray-900 dark:text-gray-100 font-semibold">{t['add']}</div>

          {/* Save and cancel buttons */}
          <div className="flex justify-end space-x-2">
            <button
              type="submit"
              name="intent"
              value="saveTask"
              className="text-sm bg-blue-500 hover:bg-blue-700 text-gray-100 px-4 rounded"
              disabled={navigation.state === 'submitting'}
            >
              {navigation.state === 'submitting' ? <Spinner size={24} lightModeColor="text-gray-100" /> : t['save']}
            </button>

            <button
              type="button"
              onClick={() => navigate(`/${listId}`)}
              className={`text-sm text-gray-500 hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-700
              hover:bg-gray-200 dark:hover:bg-gray-300
              border border-gray-500 hover:border-gray-700 dark:border-gray-100
              px-2 rounded`}
            >
              {t['cancel']}
            </button>
          </div>
        </div>

        <input type="hidden" name="listId" value={listId} />
        <input type="hidden" name="boardColumn" value={currentBoardColumn} />

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded mb-4 pt-4 px-2">
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
        </div>

        {/* Label Manager */}
        <LabelHandlingOnTaskPage
          taskLabelIds={taskLabelIds}
          setTaskLabelIds={setTaskLabelIds}
          labels={labels}
          lang={lang}
        />
      </Form>
    </div>
  )
}

export const action: ActionFunction = async ({ request }) => {
  log(`[addTask.action] starting`)

  const formData = await request.formData()
  const intent = formData.get('intent') as string
  log(`[addTask.action] intent: ${intent}`)

  const listId = formData.get('listId') as string
  if (!listId) throw new Error(`[addTask.action] listId not found.`)

  const boardColumn = formData.get('boardColumn') as BoardColumn
  if (!boardColumn) throw new Error(`[addTask.action] boardColumn not found.`)

  switch (intent) {
    case 'addLabel': {
      // Handle new label creation
      const labelNames = formData.get('labelNames') as string | null
      const labelColor = formData.get('labelColor') as string | null
      printObject(labelNames, '[addTask.action] labelNames')
      printObject(labelColor, '[addTask.action] labelColor')

      if (labelNames && labelColor) {
        const newLabelId = getUid()
        const newLabel: Label = {
          id: newLabelId,
          displayName: JSON.parse(labelNames),
          color: labelColor,
        }

        printObject(newLabel, '[addTask.action] newLabel')

        // Save the new label to the database
        await saveLabel(newLabel)
      }

      return redirect(`/addTask?listId=${listId}&boardColumn=${boardColumn}`)
    }

    case 'saveTask': {
      const taskId = getUid()
      const taskTitle = formData.get('taskTitle') as string
      const taskDetails = formData.get('taskDetails') as string
      const boardColumn = formData.get('boardColumn') as BoardColumn
      const nowStr = getNow()

      // Get labelIds from formData
      const labelIds = formData.getAll('labelIds') as string[]

      // Build the new task object.
      const taskToAdd: Task = {
        id: taskId,
        title: taskTitle,
        details: taskDetails,
        position: 0, // Put the new task at the top of the list.
        boardColumn,
        listId,
        createdAt: nowStr,
        updatedAt: nowStr,
        labelIds,
      }

      // Push all tasks in the list down one position by incrementing their `position` values.
      await pushTasksDown(listId, boardColumn)

      // Save the new task.
      await saveTask(taskToAdd)

      return redirect(`/${listId}?boardColumn=${boardColumn}`)
    }

    default:
      throw new Error(`[addTask.action] Unknown intent: ${intent}`)
  }
}
