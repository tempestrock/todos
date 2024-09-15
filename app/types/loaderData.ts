import { Label, TaskList } from "./dataTypes"

// Define the type for our loader data
export type LoaderData = {
  user: {
    attributes: {
      email: string // doesn't work/exist..?
      username: string // doesn't work/exist..?
    }
  } | null
  todoLists: TaskList[]
  labels: Label[]
}
