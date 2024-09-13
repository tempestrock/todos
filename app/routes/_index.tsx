import { LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

type Task = {
  id: string
  task: string
  completed: boolean
  createdAt: string // Creation time in the format `YYYY-MM-DD_hh:mm:ss`
}

type TodoList = {
  id: string
  name: string
  color: string
  tasks: Task[]
}

// Mock to-do list data with multiple lists
const mockTodoLists: TodoList[] = [
  {
    id: 'list-1',
    name: 'Groceries',
    color: 'blue',
    tasks: [
      { id: '1', task: 'Buy milk', completed: false, createdAt: '2024-09-13_09:00:00' },
      { id: '2', task: 'Buy eggs', completed: true, createdAt: '2024-09-13_09:05:00' },
    ],
  },
  {
    id: 'list-2',
    name: 'Work',
    color: 'green',
    tasks: [
      { id: '1', task: 'Finish report', completed: false, createdAt: '2024-09-13_10:00:00' },
      { id: '2', task: 'Email client', completed: false, createdAt: '2024-09-13_10:15:00' },
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
      <h1 className="text-2xl font-bold mb-4">Peter's ToDo Lists</h1>

      {todoLists.map((list) => (
        <div key={list.id} className={`mb-6 p-4 border-l-8`} style={{ borderColor: list.color }}>
          <h2 className="text-xl font-semibold" style={{ color: list.color }}>
            {list.name}
          </h2>
          <ul className="mt-2">
            {list.tasks.map((task) => (
              <li key={task.id} className={`p-2 mb-2 border ${task.completed ? 'line-through' : ''}`}>
                <span>{task.task}</span>
                <span className="text-sm text-gray-500 ml-4">({task.createdAt})</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
