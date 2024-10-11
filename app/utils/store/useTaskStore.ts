import { create } from 'zustand'

import { log } from '../log'
import { printObject } from '../printObject'
import { Task } from '~/types/dataTypes'

type TaskStore = {
  tasks: Task[]
  visibleTaskDetails: { [taskId: string]: boolean }
  setTasks: (tasks: Task[]) => void
  updateTask: (updatedTask: Task) => void
  toggleTaskDetails: (taskId: string) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  visibleTaskDetails: {},

  setTasks: (tasks) => {
    log(`[useTaskStore.setTasks] tasks: ${tasks.length}`)
    return set({ tasks })
  },

  updateTask: (updatedTask) => {
    printObject(updatedTask, '[useTaskStore.updateTask] updatedTask')
    return set((state) => ({
      tasks: state.tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    }))
  },

  toggleTaskDetails: (taskId) => {
    printObject(taskId, '[useTaskStore.toggleTaskDetails] taskId')
    return set((state) => ({
      visibleTaskDetails: {
        ...state.visibleTaskDetails,
        [taskId]: !state.visibleTaskDetails[taskId],
      },
    }))
  },
}))
