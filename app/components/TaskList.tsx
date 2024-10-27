import { Link } from '@remix-run/react'
import {
  ArrowDownFromLine,
  ArrowBigDownDash,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  ArrowUpFromLine,
  ArrowBigUpDash,
  ChevronDown,
  ChevronUp,
  FilePenLine,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

import Spinner from '~/components/Spinner'
import { useTranslation } from '~/contexts/TranslationContext'
import { Label, Task, BoardColumn } from '~/types/dataTypes'
import { TopOrBottom, VerticalDirection } from '~/types/directions'
import { getNiceDateTime } from '~/utils/dateAndTime'
import { LANG_DEFAULT } from '~/utils/language'

/**
 * The list of tasks that is shown in the list view.
 */

type TaskListProps = {
  tasks: Task[]
  labelsMap: Map<string, Label>
  currentLang: string
  listId: string
  currentBoardColumn: BoardColumn
  handleEdit: (taskId: string) => void
  handleMoveToColumn: (taskId: string, direction: 'prev' | 'next') => void
  handleDelete: (taskId: string) => void
  handleMoveVertically: (taskId: string, direction: VerticalDirection) => void
  handleMoveToTopOrBottom: (taskId: string, direction: TopOrBottom) => void
  loadingTaskId: string | null
  currentBoardColumnIndex: number
  boardColumns: BoardColumn[]
}

export default function TaskList({
  tasks,
  labelsMap,
  currentLang,
  listId,
  currentBoardColumn,
  handleEdit,
  handleMoveToColumn,
  handleDelete,
  handleMoveVertically,
  handleMoveToTopOrBottom,
  loadingTaskId,
  currentBoardColumnIndex,
  boardColumns,
}: TaskListProps) {
  const { t } = useTranslation()
  const [visibleTaskDetails, setVisibleTaskDetails] = useState<{ [taskId: string]: boolean }>({})

  const toggleTaskDetails = (taskId: string) => {
    setVisibleTaskDetails((prevState) => ({
      ...prevState,
      [taskId]: !prevState[taskId],
    }))
  }

  return (
    <ul className="space-y-4">
      {/* "Loop" over all tasks in the current column */}
      {tasks.map((task, index) => (
        <li
          key={task.id}
          className="border px-4 pt-2 rounded relative cursor-pointer text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 hover:dark:bg-gray-700 transition-colors duration-150"
          onClick={(e) => {
            e.stopPropagation()
            toggleTaskDetails(task.id)
          }}
        >
          {/* Title and chevron icon */}
          <div className="flex justify-between items-start mb-2">
            <div className="font-bold">{task.title}</div>
            <div className={`text-gray-700 dark:text-gray-300 ${task.details === '' ? 'opacity-30' : ''}`}>
              {visibleTaskDetails[task.id] ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </div>
          </div>

          {/* Labels of the task */}
          {task.labelIds.length > 0 && (
            <div className="mb-3">
              {task.labelIds
                .map((labelId) => labelsMap.get(labelId))
                .filter((label): label is Label => label !== undefined)
                .sort((a, b) => a.displayName[currentLang].localeCompare(b.displayName[currentLang]))
                .map((label) => {
                  return (
                    <span
                      key={label.id}
                      className="px-2 py-1 mr-2 rounded text-xs text-gray-100"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.displayName[currentLang] || label.displayName[LANG_DEFAULT]}
                    </span>
                  )
                })}
            </div>
          )}

          {/* Details and tools for task */}
          {visibleTaskDetails[task.id] && (
            <div>
              {/* Creation date and update date */}
              <div className="text-xs -mt-2 text-gray-600 dark:text-gray-400 flex gap-4">
                <div>
                  {t['created']}: {getNiceDateTime(task.createdAt, currentLang)}
                </div>
                <div>
                  {t['updated']}: {getNiceDateTime(task.updatedAt, currentLang)}
                </div>
              </div>

              {/* Task details */}
              <div className="mt-2 text-gray-900 dark:text-gray-100 dark:prose-dark prose">
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
                  }}
                >
                  {task.details}
                </ReactMarkdown>
              </div>

              {/* Task Tools (Edit, Move, Reorder, Delete) */}
              <div className="mt-4 mb-3 flex justify-between items-center">
                <div className="flex space-x-6">
                  <Link
                    to={`/editTask?listId=${listId}&taskId=${task.id}&boardColumn=${currentBoardColumn}`}
                    className="text-blue-500 hover:text-blue-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(task.id)
                    }}
                  >
                    <FilePenLine size={20} />
                  </Link>

                  <button
                    onClick={() => handleMoveToColumn(task.id, 'prev')}
                    className={`text-green-500 hover:text-green-700 ${
                      currentBoardColumnIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={currentBoardColumnIndex === 0}
                  >
                    <ArrowLeftFromLine size={20} />
                  </button>

                  <button
                    onClick={() => handleMoveToColumn(task.id, 'next')}
                    className={`text-green-500 hover:text-green-700 ${
                      currentBoardColumnIndex === boardColumns.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={currentBoardColumnIndex === boardColumns.length - 1}
                  >
                    <ArrowRightFromLine size={20} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveVertically(task.id, 'up')
                    }}
                    className={`text-teal-500 hover:text-teal-700 ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={index === 0}
                  >
                    <ArrowUpFromLine size={20} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveVertically(task.id, 'down')
                    }}
                    className={`text-teal-500 hover:text-teal-700 ${
                      index === tasks.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={index === tasks.length - 1}
                  >
                    <ArrowDownFromLine size={20} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveToTopOrBottom(task.id, 'top')
                    }}
                    className={`text-teal-500 hover:text-teal-700 ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={index === 0}
                  >
                    <ArrowBigUpDash size={20} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMoveToTopOrBottom(task.id, 'bottom')
                    }}
                    className={`text-cyan-500 hover:text-cyan-700 ${
                      index === tasks.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={index === tasks.length - 1}
                  >
                    <ArrowBigDownDash size={20} />
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(task.id)
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Spinner Overlay */}
          {loadingTaskId === task.id && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-65 flex justify-center items-center z-10">
              <Spinner size={40} lightModeColor="text-gray-100" />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
