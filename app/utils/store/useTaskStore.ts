import { create } from 'zustand'

import { Task } from '~/types/dataTypes'

type TaskStore = {
  tasks: Task[]
  visibleTaskDetails: Record<string, boolean>
  setTasks: (tasks: Task[]) => void
  updateTask: (updatedTask: Task) => void
  toggleTaskDetails: (taskId: string) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  visibleTaskDetails: {},
  setTasks: (tasks) => set({ tasks }),
  updateTask: (updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    })),
  toggleTaskDetails: (taskId) =>
    set((state) => ({
      visibleTaskDetails: {
        ...state.visibleTaskDetails,
        [taskId]: !state.visibleTaskDetails[taskId],
      },
    })),
}))
