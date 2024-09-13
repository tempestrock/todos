import { LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

// Enum to represent task statuses
enum TaskStatus {
  BACKLOG = 'backlog',
  AT_WORK = 'at work',
  FINISHED = 'finished',
}

// Function to get all TaskStatus values
const getTaskStatusValues = () => Object.values(TaskStatus)

type Task = {
  id: string
  task: string
  status: TaskStatus
  createdAt: string // Creation time in the format `YYYY-MM-DD_hh:mm:ss`
}

type TodoList = {
  id: string
  name: string
  color: string
  tasks: Task[]
}

// Mock to-do list data with multiple lists and updated status field
const mockTodoLists: TodoList[] = [
  {
    id: 'list-1',
    name: 'Groceries',
    color: 'blue',
    tasks: [
      { id: '1', task: 'Buy milk', status: TaskStatus.BACKLOG, createdAt: '2024-09-13_09:00:00' },
      { id: '2', task: 'Buy eggs', status: TaskStatus.FINISHED, createdAt: '2024-09-13_09:05:00' },
    ],
  },
  {
    id: 'list-2',
    name: 'Work',
    color: 'green',
    tasks: [
      { id: '1', task: 'Finish report', status: TaskStatus.AT_WORK, createdAt: '2024-09-13_10:00:00' },
      { id: '2', task: 'Email client', status: TaskStatus.BACKLOG, createdAt: '2024-09-13_10:15:00' },
    ],
  },
]

// Loader function to pass data to the component
export const loader: LoaderFunction = async () => {
  return mockTodoLists
}

export default function Index() {
  const todoLists = useLoaderData<TodoList[]>()

  // Get all TaskStatus values
  const statuses = getTaskStatusValues()

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My To-Do Lists</h1>

      {todoLists.map((list) => (
        <div key={list.id} className={`mb-6`}>
          <h2 className="text-xl font-semibold" style={{ color: list.color }}>
            {list.name}
          </h2>

          {/* Dynamic grid layout based on TaskStatus count */}
          <div className={`grid grid-cols-${statuses.length} gap-4`}>
            {statuses.map((status) => (
              <div key={status}>
                <h3 className="text-lg font-semibold text-gray-700 mb-2 capitalize">{status}</h3>
                <ul className="border border-gray-300 p-2 rounded">
                  {list.tasks
                    .filter((task) => task.status === status)
                    .map((task) => (
                      <li key={task.id} className="p-2 mb-2 border-b">
                        <span>{task.task}</span>
                        <span className="ml-4 text-sm text-gray-500">({task.createdAt})</span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
