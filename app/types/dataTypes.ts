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
  labelIds: string[]
}

// Enum to represent board columns. CUSTOMIZE_ME
export enum BoardColumn {
  BACKLOG = 'backlog',
  IN_PROGRESS = 'in progress',
  DONE = 'done',
}

export type Label = {
  id: string
  displayName: { [key: string]: string }
  color: string
}

export type User = {
  id: string
  displayName: string
  taskListIds: string[] // the IDs of those task lists that the user is allowed to see
}

export const UserUndefined: User = { id: UNDEF, displayName: UNDEF, taskListIds: [] }
