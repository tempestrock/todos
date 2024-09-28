import { create } from 'zustand'

import { Task } from '~/types/dataTypes'

type TaskStore = {
  tasks: Task[]
  visibleTaskDetails: { [taskId: string]: boolean }
  setTasks: (tasks: Task[]) => void
  toggleTaskDetails: (taskId: string) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  visibleTaskDetails: {},
  setTasks: (tasks) => set({ tasks }),

  toggleTaskDetails: (taskId) =>
    set((state) => ({
      visibleTaskDetails: {
        ...state.visibleTaskDetails,
        [taskId]: !state.visibleTaskDetails[taskId],
      },
    })),
}))
