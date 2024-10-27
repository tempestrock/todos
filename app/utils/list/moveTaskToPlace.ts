import { loadTask, loadTaskList, saveTask } from '../database/taskOperations'
import { log } from '../log'
import { printObject } from '../printObject'
import { BoardColumn, Task } from '~/types/dataTypes'
import { TopOrBottom } from '~/types/directions'

export const moveTaskToPlace = async (taskId: string, targetPlace: TopOrBottom, listId: string): Promise<void> => {
  // Get the task to move from the database.
  const taskToMove = await loadTask(taskId)
  if (!taskToMove) throw new Error('[moveTaskToPosition] Failed to load task')
  printObject(taskToMove, '[moveTaskToPosition] taskToMove')

  // Get the list of tasks that are in the same column as the task to move.
  const tasks = await getTasksOfListAndColumn(listId, taskToMove.boardColumn)
  printObject(tasks, '[moveTaskToPosition] tasks before move')

  const targetPosition = targetPlace === 'top' ? 0 : tasks.length - 1

  const currentPosition = taskToMove.position

  log(`Moving task from position ${currentPosition} to position ${targetPosition}.`)

  // Move all tasks between the current position and the target position.
  if (currentPosition > targetPosition) {
    // The task is moving up the list, so the other tasks move down.

    log('Moving tasks down.')
    for (let index = targetPosition; index < currentPosition; index++) {
      tasks[index].position = index + 1
    }

    // Move the task to move to the target position.
    tasks[currentPosition].position = targetPosition
    printObject(tasks, '[moveTaskToPosition] tasks after move')

    log('Saving tasks.')
    for (let index = targetPosition; index <= currentPosition; index++) {
      await saveTask(tasks[index])
    }
  } else {
    // The task is moving down the list, so the other tasks move up.

    log('Moving tasks up.')
    for (let index = currentPosition + 1; index <= targetPosition; index++) {
      tasks[index].position = index - 1
    }

    // Move the task to move to the target position.
    tasks[currentPosition].position = targetPosition
    printObject(tasks, '[moveTaskToPosition] tasks after move')

    log('Saving tasks.')
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
