import { BoardColumn } from '~/types/dataTypes'
import { loadTaskList } from '~/utils/database/loadTaskList'
import { saveTask } from '~/utils/database/saveAndUpdateData'
import { log } from '~/utils/log'

/**
 * Pushes all tasks in the given board column of the given list down one position
 * by incrementing their `position` values.
 *
 * @param {string} listId - The ID of the list.
 * @param {BoardColumn} boardColumn - The column of the board.
 * @return {Promise<void>} A promise that resolves when all tasks have been pushed down.
 */
export const pushTasksDown = async (listId: string, boardColumn: BoardColumn): Promise<void> => {
  // Push all tasks in the list down one position by incrementing their `position` values.
  const taskList = await loadTaskList(listId)
  const tasksInColumn = taskList.tasks.filter((task) => task.boardColumn === boardColumn)
  log(
    `[pushTasksDown] ${tasksInColumn.length} tasks to push down in list '${taskList.displayName}', colum '${boardColumn}'.`
  )

  for (const task of tasksInColumn) {
    log(`[pushTasksDown] pushing down task '${task.title}'`)
    task.position++
    await saveTask(task)
  }
}
