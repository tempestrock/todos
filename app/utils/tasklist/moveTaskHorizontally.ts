import { BoardColumn, Task } from '~/types/dataTypes'
import { loadTask, updateBoardColumn } from '~/utils/database/taskOperations'
import { getNow } from '~/utils/dateAndTime'
import { moveUpTasksBelowPosition, moveAllTasksDownOnePosition } from '~/utils/tasklist/movePartsOfLists'

/**
 * Moves a task to a new board column.
 *
 * This involves updating the task's column and position to 0, pushing all tasks in the target column down one position,
 * and then moving all tasks in the original column below the moved task's original position up one position.
 *
 * @param {string} listId - The ID of the task list.
 * @param {string} taskId - The ID of the task to move.
 * @param {BoardColumn} targetColumn - The target column of the move action.
 * @return {Promise<void>} A promise that resolves when the task has been moved.
 * @throws {Error} If the task does not exist in the database.
 */
export const moveTaskHorizontally = async (
  listId: string,
  taskId: string,
  targetColumn: BoardColumn
): Promise<void> => {
  const taskToMove = await loadTask(taskId)
  if (!taskToMove) throw new Error(`Could not find task '${taskId}' to update.`)

  const boardColumnSoFar = taskToMove.boardColumn
  const positionSoFar = taskToMove.position

  // Update the task with the new column
  const updatedTask: Task = {
    ...taskToMove,
    position: 0, // Put the new task at the top of the list in the new board column.
    boardColumn: targetColumn,
    updatedAt: getNow(),
  }

  // Push all tasks in the target column down one position as the moved task is now at the top.
  await moveAllTasksDownOnePosition(listId, targetColumn)

  // Save the updated task.
  await updateBoardColumn(updatedTask)

  // Move all tasks below the moved task up one position.
  await moveUpTasksBelowPosition(listId, boardColumnSoFar, positionSoFar)
}
