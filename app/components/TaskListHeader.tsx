import { ChevronDown, ChevronUp } from 'lucide-react'

import HomeButton from './HomeButton'
import MoreMenu from '~/components/MoreMenu'
import { useTranslation } from '~/contexts/TranslationContext'
import { BoardColumn, Task } from '~/types/dataTypes'
import { capitalizeFirstLetter } from '~/utils/stringHandling'

/**
 * The header of the list view, showing - among others - the board column names.
 */

type HeaderProps = {
  tasks: Task[]
  listId: string
  listColor: string
  boardColumns: BoardColumn[]
  currentBoardColumnIndex: number
  handleHomeClick: () => void
  handleColumnChange: (index: number) => void
  toggleLabelFilterVisibility: () => void
  labelFilterVisible: boolean
  loadingHome: boolean
  currentBoardColumn: BoardColumn
}

export default function TaskListHeader({
  tasks,
  listId,
  listColor,
  boardColumns,
  currentBoardColumnIndex,
  handleHomeClick,
  handleColumnChange,
  toggleLabelFilterVisibility,
  labelFilterVisible,
  loadingHome,
  currentBoardColumn,
}: HeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 z-10 shadow-md">
      <div className="container mx-auto pt-4 px-4 flex justify-between items-center">
        {/* Home Button */}
        <HomeButton loadingHome={loadingHome} handleHomeClick={handleHomeClick} />

        {/* Board Column Buttons */}
        <div className="flex space-x-1">
          {boardColumns.map((column, index) => (
            <button
              key={column}
              onClick={() => handleColumnChange(index)}
              className={`px-2 py-2 text-xs font-medium rounded-md transition-colors duration-150 border`}
              style={{
                backgroundColor: index === currentBoardColumnIndex ? listColor : 'transparent',
                color: index === currentBoardColumnIndex ? 'white' : listColor,
                borderColor: listColor,
              }}
            >
              {capitalizeFirstLetter(t[column])} (
              {tasks.filter((task) => task.boardColumn === boardColumns[index]).length})
            </button>
          ))}
        </div>

        {/* 'More' Menu */}
        <MoreMenu hasAddButton={true} listId={listId} currentBoardColumn={currentBoardColumn} />
      </div>

      {/* Label Filter display toggle */}
      <div className="-mb-3">
        <div className="relative">
          <div className="border-t border-blue-700 absolute top-1/2 left-0 right-0"></div>
          <button
            onClick={() => toggleLabelFilterVisibility()}
            className="relative z-10 mx-auto w-12 flex justify-center items-center text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900"
          >
            {labelFilterVisible ? <ChevronDown /> : <ChevronUp />}
          </button>
        </div>
      </div>
    </div>
  )
}
