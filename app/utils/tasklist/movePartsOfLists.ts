import { BoardColumn } from '~/types/dataTypes'
import { loadTaskList, saveTask } from '~/utils/database/taskOperations'

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

/**
 * Moves all tasks in the given board column of the given list down one position
 * by incrementing their `position` values.
 *
 * @param {string} listId - The ID of the list.
 * @param {BoardColumn} boardColumn - The column of the board.
 * @return {Promise<void>} A promise that resolves when all tasks have been pushed down.
 */
export const moveAllTasksDownOnePosition = async (listId: string, boardColumn: BoardColumn): Promise<void> => {
  // Push all tasks in the list down one position by incrementing their `position` values.
  const taskList = await loadTaskList(listId)
  const tasksInColumn = taskList.tasks.filter((task) => task.boardColumn === boardColumn)

  for (const task of tasksInColumn) {
    task.position++
    await saveTask(task)
  }
}
