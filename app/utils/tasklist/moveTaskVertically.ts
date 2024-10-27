import { BoardColumn, Task } from '~/types/dataTypes'
import { VerticalMoveTarget } from '~/types/moveTargets'
import { loadTask, loadTaskList, saveTask } from '~/utils/database/taskOperations'

export const moveTaskVertically = async (
  taskId: string,
  moveTarget: VerticalMoveTarget,
  listId: string
): Promise<void> => {
  // Get the task to move from the database.
  const taskToMove = await loadTask(taskId)
  if (!taskToMove) throw new Error('[moveTaskToPosition] Failed to load task')

  // Get the list of tasks that are in the same column as the task to move.
  const tasks = await getTasksOfListAndColumn(listId, taskToMove.boardColumn)

  const currentPosition = taskToMove.position
  const targetPosition = getPositionFromMoveTarget(currentPosition, moveTarget, tasks.length)

  // Move all tasks between the current position and the target position.
  if (currentPosition > targetPosition) {
    // The task is moving up the list, so the other tasks move down.
    for (let index = targetPosition; index < currentPosition; index++) {
      tasks[index].position = index + 1
    }

    // Move the task to move to the target position.
    tasks[currentPosition].position = targetPosition

    // Save all modified tasks.
    for (let index = targetPosition; index <= currentPosition; index++) {
      await saveTask(tasks[index])
    }
  } else {
    // The task is moving down the list, so the other tasks move up.
    for (let index = currentPosition + 1; index <= targetPosition; index++) {
      tasks[index].position = index - 1
    }

    // Move the task to move to the target position.
    tasks[currentPosition].position = targetPosition

    // Save all modified tasks.
    for (let index = currentPosition; index <= targetPosition; index++) {
      await saveTask(tasks[index])
    }
  }
}

/**
 * Gets all tasks of a given list and board column.
 *
 * @param {string} listId - The ID of the task list.
 * @param {BoardColumn} boardColumn - The board column.
 * @return {Promise<Task[]>} A promise that resolves with all tasks of the given list and board column, sorted by position.
 */
const getTasksOfListAndColumn = async (listId: string, boardColumn: BoardColumn): Promise<Task[]> => {
  const taskList = await loadTaskList(listId)
  return taskList.tasks.filter((task) => task.boardColumn === boardColumn).sort((a, b) => a.position - b.position)
}

/**
 * Calculates the target position for a task move action, given the current position
 * of the task, the target, and the number of tasks in the list.
 *
 * @param {number} currentPosition - The current position of the task.
 * @param {VerticalMoveTarget} moveTarget - The target of the move action.
 * @param {number} numTasks - The number of tasks in the list.
 * @return {number} The target position of the task.
 */
const getPositionFromMoveTarget = (
  currentPosition: number,
  moveTarget: VerticalMoveTarget,
  numTasks: number
): number => {
  switch (moveTarget) {
    case VerticalMoveTarget.top:
      return 0

    case VerticalMoveTarget.bottom:
      return numTasks - 1

    case VerticalMoveTarget.oneUp:
      return currentPosition - 1

    case VerticalMoveTarget.oneDown:
      return currentPosition + 1

    default:
      throw new Error(`[getPositionFromPlace]: unknown targetPlace '${moveTarget as any}'`)
  }
}
