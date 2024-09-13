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
type Task = {
  id: string
  task: string
  status: TaskStatus
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

// Mock to-do list data with tasks that have labels
export const mockTodoLists: TodoList[] = [
  {
    id: 'list-1',
    name: 'Groceries',
    color: 'blue',
    tasks: [
      { id: '1', task: 'Buy milk', status: TaskStatus.BACKLOG, createdAt: '2024-09-13_09:00:00', labels: ['Home'] },
      {
        id: '2',
        task: 'Buy eggs',
        status: TaskStatus.FINISHED,
        createdAt: '2024-09-13_09:05:00',
        labels: ['Urgent', 'Home'],
      },
    ],
  },
  {
    id: 'list-2',
    name: 'Work',
    color: 'green',
    tasks: [
      {
        id: '1',
        task: 'Finish report',
        status: TaskStatus.AT_WORK,
        createdAt: '2024-09-13_10:00:00',
        labels: ['Work'],
      },
      {
        id: '2',
        task: 'Email client',
        status: TaskStatus.BACKLOG,
        createdAt: '2024-09-13_10:15:00',
        labels: ['Urgent'],
      },
    ],
  },
]
