import { loadTask } from '~/utils/database/loadTask'
import { saveTask } from '~/utils/database/saveAndUpdateData'

/**
 * Swaps the order of two tasks in a list.
 *
 * @param {string} listId - The ID of the list containing the tasks to swap.
 * @param {string} taskId1 - The ID of the first task to swap.
 * @param {string} taskId2 - The ID of the second task to swap.
 * @return {Promise<void>} A promise that resolves when the swap is complete.
 */
export async function swapTasks(listId: string, taskId1: string, taskId2: string): Promise<void> {
  // Fetch the two tasks we're swapping.
  const task1 = await loadTask(listId, taskId1)
  const task2 = await loadTask(listId, taskId2)

  if (!task1 || !task2) {
    throw new Error('[swapTasks] Task not found')
  }

  // Swap their order values.
  const tempOrder = task1.position
  task1.position = task2.position
  task2.position = tempOrder

  // Update both tasks in the database.
  await saveTask(listId, task1)
  await saveTask(listId, task2)
}
