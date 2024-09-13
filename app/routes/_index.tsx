import { LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

// Enum to represent task statuses
enum TaskStatus {
  BACKLOG = 'backlog',
  AT_WORK = 'at work',
  FINISHED = 'finished',
}

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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My To-Do Lists</h1>

      {todoLists.map((list) => (
        <div key={list.id} className={`mb-6 p-4 border-l-8`} style={{ borderColor: list.color }}>
          <h2 className="text-xl font-semibold" style={{ color: list.color }}>
            {list.name}
          </h2>
          <ul className="mt-2">
            {list.tasks.map((task) => (
              <li key={task.id} className={`p-2 mb-2 border`}>
                <span>{task.task}</span>
                <span className="ml-4 text-sm text-gray-500">({task.createdAt})</span>
                <span
                  className={`ml-4 px-2 py-1 rounded text-xs ${
                    task.status === TaskStatus.FINISHED
                      ? 'bg-green-200 text-green-700'
                      : task.status === TaskStatus.AT_WORK
                      ? 'bg-yellow-200 text-yellow-700'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
