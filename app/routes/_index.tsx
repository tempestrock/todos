import type { MetaFunction } from '@remix-run/node'

export const meta: MetaFunction = () => {
  return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }]
}

import { LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'

type Todo = {
  id: string
  task: string
  completed: boolean
}

// Mock to-do list data
const mockTodos: Todo[] = [
  { id: '1', task: 'Buy groceries', completed: false },
  { id: '2', task: 'Clean the house', completed: true },
  { id: '3', task: 'Finish Remix project', completed: false },
]

// Loader function to pass data to the component
export const loader: LoaderFunction = async () => {
  return mockTodos
}

export default function Index() {
  const todos = useLoaderData<Todo[]>()

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My To-Do List</h1>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} className={`p-2 mb-2 border ${todo.completed ? 'line-through' : ''}`}>
            {todo.task}
          </li>
        ))}
      </ul>
    </div>
  )
}
