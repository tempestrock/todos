export const UNDEF = 'undefined'

export type DateTimeString = `${string}-${string}-${string}_${string}:${string}:${string}`

// A TaskList is something like "ToDos", "Groceries", etc.
export type TaskList = {
  id: string
  displayName: string
  position: number
  color: string
  tasks: Task[]
}

export const TaskListUndefined: TaskList = { id: UNDEF, displayName: UNDEF, position: -1, color: UNDEF, tasks: [] }

// A TaskList without the tasks is a TaskListMetadata object.
export type TaskListMetadata = {
  id: string
  displayName: string
  position: number
  color: string
}

// One element in a task list. The central object of the whole app.
export type Task = {
  id: string
  title: string
  details: string
  boardColumn: BoardColumn
  position: number // the position of the task in the list and in the boardColumn; top is 0 for each column
  listId: string
  createdAt: DateTimeString
  updatedAt: DateTimeString
  labels: string[]
}

// Enum to represent board columns.
export enum BoardColumn {
  BACKLOG = 'backlog',
  IN_PROGRESS = 'in progress',
  DONE = 'done',
}

// Label structure with name and color
export type Label = {
  name: string
  color: string
}

// List of available labels (with the restriction that label names must be unique)
export const availableLabels: Label[] = [
  { name: 'Urgent', color: 'red' },
  { name: 'Home', color: 'blue' },
  { name: 'Work', color: 'green' },
]

export type User = {
  id: string
  displayName: string
  taskListIds: string[] // the IDs of those task lists that the user is allowed to see
}

export const UserUndefined: User = { id: UNDEF, displayName: UNDEF, taskListIds: [] }
