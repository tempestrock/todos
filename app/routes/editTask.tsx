import { ActionFunction, LoaderFunction, LoaderFunctionArgs, json, redirect } from '@remix-run/node'
import { Form, useLoaderData, useNavigation, useNavigate, useSearchParams } from '@remix-run/react'
import { useState, useEffect, useRef } from 'react'

import LabelManager from '~/components/LabelManager'
import Spinner from '~/components/Spinner'
import { useTranslation } from '~/contexts/TranslationContext'
import { Task, BoardColumn, DateTimeString, Label } from '~/types/dataTypes'
import { requireAuth } from '~/utils/auth/session.server'
import { loadAllLabels } from '~/utils/database/loadAllLabels'
import { loadTask } from '~/utils/database/loadTask'
import { saveTask } from '~/utils/database/saveAndUpdateData'
import { saveLabel } from '~/utils/database/saveLabel'
import { getNow } from '~/utils/dateAndTime'
import { getUid } from '~/utils/getUid'
import { LANG_DEFAULT } from '~/utils/language'
import { printObject } from '~/utils/printObject'

type LoaderData = {
  task: Task
  labels: Label[]
}

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  console.log('[editTask.loader] starting')
  await requireAuth(request)
  const url = new URL(request.url)
  const taskId = url.searchParams.get('taskId')

  if (!taskId) throw new Error('[editTask.loader] No task ID provided')

  const task = await loadTask(taskId)
  if (!task) throw new Error('[editTask.loader] Failed to load task')

  // Load all labels
  const labels = await loadAllLabels()

  return json<LoaderData>({ task, labels })
}

export default function EditTaskView() {
  const { task, labels } = useLoaderData<LoaderData>()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const [taskTitle, setTaskTitle] = useState(task?.title || '')
  const [taskDetails, setTaskDetails] = useState(task?.details || '')
  const [taskLabels, setTaskLabels] = useState<string[]>([...new Set(task?.labelIds || [])])
  const [searchParams] = useSearchParams()
  const currentBoardColumn = searchParams.get('boardColumn') as BoardColumn
  const listId = searchParams.get('listId')
  if (!listId) throw new Error('[editTask.component] No list ID provided')
  const { t } = useTranslation()
  const lang = typeof window !== 'undefined' ? localStorage.getItem('lang') || LANG_DEFAULT : LANG_DEFAULT

  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus on the title input field
    if (titleInputRef.current) {
      titleInputRef.current.focus()
    }

    if (task) {
      setTaskTitle(task.title)
      setTaskDetails(task.details)
      setTaskLabels(task.labelIds || [])
    }
  }, [task])

  // Create a Map of labels for efficient lookup
  const labelsMap = new Map<string, Label>()
  labels.forEach((label) => labelsMap.set(label.id, label))

  return (
    <div className="container mx-auto p-4">
      <Form method="post">
        <div className="flex justify-between mb-4">
          <div className="text-2xl text-gray-900 dark:text-gray-100 font-semibold">{t['edit-task']}</div>

          {/* Save and cancel buttons */}
          <div className="flex justify-end space-x-2">
            <button
              type="submit"
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
        <input type="hidden" name="taskId" value={task.id} />
        <input type="hidden" name="boardColumn" value={currentBoardColumn} />
        <input type="hidden" name="position" value={task.position} />
        <input type="hidden" name="createdAt" value={task.createdAt} />

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded mb-4 pt-4 px-2">
          {/* Task title field */}
          <input
            ref={titleInputRef}
            type="text"
            name="taskTitle"
            placeholder="Task Title"
            className="w-full p-2 border border-blue-300 rounded mb-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 dark:border-gray-700"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />

          {/* Task details field */}
          <textarea
            name="taskDetails"
            placeholder="Task Details"
            className="w-full p-2 border rounded mb-4 h-48 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            value={taskDetails}
            onChange={(e) => setTaskDetails(e.target.value)}
          />
        </div>

        {/* Label Manager */}
        <LabelManager taskLabels={taskLabels} setTaskLabels={setTaskLabels} labels={labels} lang={lang} />
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

  // Get labelIds from formData
  const labelIds = formData.getAll('labelIds') as string[]
  printObject(labelIds, `[editTask.action] labelIds`)

  // Check if new label data exists
  const newLabelNames = formData.get('newLabelNames') as string | null
  const newLabelColor = formData.get('newLabelColor') as string | null

  if (newLabelNames && newLabelColor) {
    // Handle new label creation
    const newLabelId = getUid()
    const newLabel: Label = {
      id: newLabelId,
      displayName: JSON.parse(newLabelNames),
      color: newLabelColor,
    }

    // Save the new label to the database
    await saveLabel(newLabel)

    // Add the new label to the task
    labelIds.push(newLabelId)
  }

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
    labelIds,
  }

  console.log(`[editTask.action] listId: '${listId}'`)
  printObject(task, `[editTask.action] updated task`)

  await saveTask(task)

  return redirect(`/${listId}`)
}
