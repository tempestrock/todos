import { BoardColumn } from '~/types/dataTypes'
import { loadTaskList } from '~/utils/database/loadTaskList'
import { saveTask } from '~/utils/database/saveAndUpdateData'

/**
 * Moves tasks in the given board column up by one position, starting from the specified position + 1.
 *
 * @param {string} listId - The ID of the list to move tasks in.
 * @param {BoardColumn} boardColumn - The column of the board to move tasks in.
 * @param {number} position - The position to start moving tasks from.
 * @return {Promise<void>} A promise that resolves when all tasks have been moved.
 */
export const moveUpTasksBelowPosition = async (
  listId: string,
  boardColumn: BoardColumn,
  position: number
): Promise<void> => {
  // Get all tasks that are in the given board column and below the specified position.
  const taskList = await loadTaskList(listId)
  const tasksInColumnBelowPosition = taskList.tasks.filter(
    (task) => task.boardColumn === boardColumn && task.position > position
  )

  // Reduce the position of the found tasks by one.
  for (const task of tasksInColumnBelowPosition) {
    task.position--
    await saveTask(task)
  }
}
