// Enum to represent task statuses
export enum TaskStatus {
  BACKLOG = 'backlog',
  AT_WORK = 'at work',
  FINISHED = 'finished',
}

// Label structure with name and color
export type Label = {
  name: string
  color: string
}

// Task structure with labels
export type Task = {
  id: string
  title: string
  status: TaskStatus
  listId: string
  createdAt: string
  labels: string[] // Array of label names
}

export type TaskList = {
  id: string
  name: string
  color: string
  tasks: Task[]
}

export type TaskListMetadata = {
  id: string
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
