export const UNDEF = 'undefined'

export type DateTimeString = `${string}-${string}-${string}_${string}:${string}:${string}`

// A TaskList is something like "ToDos", "Groceries", etc.
export type TaskList = {
  id: string
  name: string
  color: string
  tasks: Task[]
}

export const TaskListUndefined: TaskList = { id: UNDEF, name: UNDEF, color: UNDEF, tasks: [] }

// A TaskList without the tasks is a TaskListMetadata object.
export type TaskListMetadata = {
  id: string
  name: string
  color: string
}

// One element in a task list. The central object of the whole app.
export type Task = {
  id: string
  title: string
  details: string
  boardColumn: BoardColumn
  listId: string
  createdAt: DateTimeString
  updatedAt: DateTimeString
  labels: string[]
}

// Enum to represent board columns.
export enum BoardColumn {
  BACKLOG = 'backlog',
  AT_WORK = 'at work',
  FINISHED = 'finished',
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
  cognitoUser: {
    username: string
  }
}
