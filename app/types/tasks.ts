// Enum to represent task statuses
export enum TaskStatus {
  BACKLOG = 'backlog',
  AT_WORK = 'at work',
  FINISHED = 'finished',
  ON_HOLD = 'on hold',
}

// Label structure with name and color
export type Label = {
  name: string
  color: string
}

// Task structure with labels
export type Task = {
  id: string
  task: string
  status: TaskStatus
  listId: string
  createdAt: string
  labels: string[] // Array of label names
}

export type TodoList = {
  id: string
  name: string
  color: string
  tasks: Task[]
}

// List of available labels (with the restriction that label names must be unique)
export const availableLabels: Label[] = [
  { name: 'Urgent', color: 'red' },
  { name: 'Home', color: 'blue' },
  { name: 'Work', color: 'green' },
]
