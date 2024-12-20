import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Outlet, useLoaderData, useNavigate, useNavigation, useSearchParams } from '@remix-run/react'
import { useEffect, useMemo, useState } from 'react'

import TaskList from '~/components/TaskList'
import TaskListHeader from '~/components/TaskListHeader'
import TaskListLabelFilter from '~/components/TaskListLabelFilter'
import { useTranslation } from '~/contexts/TranslationContext'
import { useTaskActions } from '~/hooks/useTaskActions'
import { Label, TaskList as TaskListType, BoardColumn, TaskListUndefined } from '~/types/dataTypes'
import { VerticalMoveTarget } from '~/types/moveTargets'
import { requireAuth } from '~/utils/auth/requireAuth'
import { loadLabels } from '~/utils/database/labelOperations'
import { deleteTask, loadTask, loadTaskList } from '~/utils/database/taskOperations'
import { LANG_DEFAULT } from '~/utils/language'
import { log } from '~/utils/log'
import { moveUpTasksBelowPosition } from '~/utils/tasklist/movePartsOfLists'
import { moveTaskHorizontally } from '~/utils/tasklist/moveTaskHorizontally'
import { moveTaskVertically } from '~/utils/tasklist/moveTaskVertically'

type LoaderData = {
  taskList: TaskListType
  labels: Label[]
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const authResult = await requireAuth(request, params.listId)

  if (!params.listId) throw new Error('[$listId.loader] No list ID provided')

  const taskList = await loadTaskList(params.listId)

  // If the task list cannot be found, return a 404.
  // This will be handled by the ErrorBoundary function.
  if (taskList === TaskListUndefined) throw new Response('Not Found', { status: 404 })

  // Sort tasks by position.
  taskList.tasks.sort((a, b) => a.position - b.position)

  // Collect all label IDs from tasks.
  const labelIdsSet = new Set<string>()
  taskList.tasks.forEach((task) => {
    task.labelIds.forEach((labelId) => labelIdsSet.add(labelId))
  })
  const labelIds = Array.from(labelIdsSet)

  // Load labels from the database.
  const labels = await loadLabels(labelIds)

  return json<LoaderData>({ taskList, labels }, { headers: authResult.headers })
}

export default function ListView() {
  const { taskList, labels } = useLoaderData<LoaderData>()
  const [searchParams] = useSearchParams()

  const listId = taskList.id
  const listColor = taskList.color

  // Get the boardColumn parameter from the URL.
  const boardColumns = Object.values(BoardColumn)
  const initialBoardColumn = searchParams.get('boardColumn') as BoardColumn | undefined
  const initialBoardColumnIndex = initialBoardColumn ? boardColumns.indexOf(initialBoardColumn) : 0
  const validatedBoardColumnIndex = initialBoardColumnIndex >= 0 ? initialBoardColumnIndex : 0
  const [currentBoardColumnIndex, setCurrentBoardColumnIndex] = useState(validatedBoardColumnIndex)
  const currentBoardColumn = boardColumns[currentBoardColumnIndex]

  const navigate = useNavigate()
  const navigation = useNavigation()

  const { t } = useTranslation()
  const currentLang = typeof window !== 'undefined' ? localStorage.getItem('lang') || LANG_DEFAULT : LANG_DEFAULT

  const tasks = taskList.tasks

  // State for selected labels
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [labelFilterVisible, setLabelFilterVisible] = useState(false)

  // Create a map of labels for efficient lookup.
  const labelsMap = useMemo(() => {
    const map = new Map<string, Label>()
    labels.forEach((label) => map.set(label.id, label))
    return map
  }, [labels])

  // Reset loading state when navigation is idle.
  useEffect(() => {
    if (navigation.state === 'idle') {
      // Reset spinner once the navigation completes. This is necessary for
      // the spinner of the movement of tasks to work correctly.
      setLoadingTaskId(null)
    }
  }, [navigation.state])

  const { handleEdit, handleDelete, handleHorizontalMove, handleVerticalMove, loadingTaskId, setLoadingTaskId } =
    useTaskActions({
      listId,
      currentBoardColumn,
      boardColumns,
    })

  /**
   * Updates the board column based on the provided index and navigates to the corresponding URL.
   *
   * @param {number} index - The index of the board column to set
   */
  const handleColumnChange = (index: number) => {
    setCurrentBoardColumnIndex(index)

    // Update the URL query parameter to reflect the current board column
    navigate(`/${listId}?boardColumn=${boardColumns[index]}`, { replace: true })
  }

  const toggleLabelFilterVisibility = () => setLabelFilterVisible(!labelFilterVisible)

  const clearLabelFilters = () => {
    setSelectedLabelIds([])
  }

  const tasksInCurrentColumn = useMemo(() => {
    return tasks
      .filter((task) => {
        if (task.boardColumn !== currentBoardColumn) return false
        if (selectedLabelIds.length === 0 || !labelFilterVisible) return true
        // Include tasks that have all selected labels.
        return selectedLabelIds.every((labelId) => task.labelIds.includes(labelId))
      })
      .sort((a, b) => a.position - b.position)
  }, [tasks, currentBoardColumn, selectedLabelIds, labelFilterVisible])

  return (
    <div className="container mx-auto">
      {/* TaskListHeader */}
      <TaskListHeader
        tasks={tasks}
        listId={listId}
        listColor={listColor}
        boardColumns={boardColumns}
        currentBoardColumnIndex={currentBoardColumnIndex}
        handleColumnChange={handleColumnChange}
        toggleLabelFilterVisibility={toggleLabelFilterVisibility}
        labelFilterVisible={labelFilterVisible}
        currentBoardColumn={currentBoardColumn}
      />

      {/* Label Filter */}
      <TaskListLabelFilter
        labels={labels}
        selectedLabelIds={selectedLabelIds}
        setSelectedLabelIds={setSelectedLabelIds}
        labelFilterVisible={labelFilterVisible}
        clearLabelFilters={clearLabelFilters}
        currentLang={currentLang}
      />

      {/* Task List */}
      <div className={`${labelFilterVisible ? 'pt-4' : 'pt-20'} px-4 mb-4`}>
        {tasksInCurrentColumn.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400">{t['no-tasks']}</div>
        ) : (
          <TaskList
            tasks={tasksInCurrentColumn}
            labelsMap={labelsMap}
            currentLang={currentLang}
            listId={listId}
            currentBoardColumn={currentBoardColumn}
            handleEdit={handleEdit}
            handleHorizontalMove={handleHorizontalMove}
            handleVerticalMove={handleVerticalMove}
            handleDelete={handleDelete}
            loadingTaskId={loadingTaskId}
            currentBoardColumnIndex={currentBoardColumnIndex}
            boardColumns={boardColumns}
          />
        )}
      </div>

      <Outlet />
    </div>
  )
}

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData()

  // Get data that is needed for in every action.
  const intent = formData.get('intent') as string
  const listId = formData.get('listId') as string
  const taskId = formData.get('taskId') as string

  try {
    switch (intent) {
      case 'delete': {
        const taskToDelete = await loadTask(taskId)
        if (!taskToDelete) throw new Error(`Could not find task '${taskId}' to delete.`)

        const boardColumnOfDeletedTask = taskToDelete.boardColumn
        const positionOfDeletedTask = taskToDelete.position

        await deleteTask(listId, taskId)
        await moveUpTasksBelowPosition(listId, boardColumnOfDeletedTask, positionOfDeletedTask)

        return json({ success: true, message: 'Task deleted successfully' })
      }

      case 'moveHorizontally': {
        const targetColumn = formData.get('targetColumn') as BoardColumn
        await moveTaskHorizontally(listId, taskId, targetColumn)
        return json({ success: true, message: 'Task moved successfully' })
      }

      case 'moveVertically': {
        const moveTarget = formData.get('moveTarget') as VerticalMoveTarget
        await moveTaskVertically(taskId, moveTarget, listId)
        return json({ success: true, message: `Task moved successfully: ${moveTarget}` })
      }

      default:
        log(`[$listId.action] Unknown action '${intent}'`)
        return json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    log('[$listId.action]', error)
    return json({ error: '[$listId.action] Failed to process action' }, { status: 500 })
  }
}
