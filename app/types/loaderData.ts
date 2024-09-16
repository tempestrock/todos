import { Label, TaskList, User } from './dataTypes'

// Define the type for our loader data
export type LoaderData = {
  user: User | null
  todoLists: TaskList[]
  labels: Label[]
}
