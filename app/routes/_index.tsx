import { LoaderFunction, redirect } from '@remix-run/node'
import { getCurrentUser } from '@aws-amplify/auth'
import { Amplify } from 'aws-amplify'
import awsconfig from '../aws-exports'
import { useLoaderData } from '@remix-run/react'

// // Configure Amplify with aws-exports
// Amplify.configure(awsconfig)

// Enum to represent task statuses
enum TaskStatus {
  BACKLOG = 'backlog',
  AT_WORK = 'at work',
  FINISHED = 'finished',
  ON_HOLD = 'on hold',
}

// Label structure with name and color
type Label = {
  name: string
  color: string
}

// Task structure with labels
type Task = {
  id: string
  task: string
  status: TaskStatus
  createdAt: string
  labels: string[] // Array of label names
}

type TodoList = {
  id: string
  name: string
  color: string
  tasks: Task[]
}

// List of available labels (with the restriction that label names must be unique)
const availableLabels: Label[] = [
  { name: 'Urgent', color: 'red' },
  { name: 'Home', color: 'blue' },
  { name: 'Work', color: 'green' },
]

// Mock to-do list data with tasks that have labels
const mockTodoLists: TodoList[] = [
  {
    id: 'list-1',
    name: 'Groceries',
    color: 'blue',
    tasks: [
      { id: '1', task: 'Buy milk', status: TaskStatus.BACKLOG, createdAt: '2024-09-13_09:00:00', labels: ['Home'] },
      {
        id: '2',
        task: 'Buy eggs',
        status: TaskStatus.FINISHED,
        createdAt: '2024-09-13_09:05:00',
        labels: ['Urgent', 'Home'],
      },
    ],
  },
  {
    id: 'list-2',
    name: 'Work',
    color: 'green',
    tasks: [
      {
        id: '1',
        task: 'Finish report',
        status: TaskStatus.AT_WORK,
        createdAt: '2024-09-13_10:00:00',
        labels: ['Work'],
      },
      {
        id: '2',
        task: 'Email client',
        status: TaskStatus.BACKLOG,
        createdAt: '2024-09-13_10:15:00',
        labels: ['Urgent'],
      },
    ],
  },
]

// Loader function to pass data to the component
export const loader: LoaderFunction = async () => {
  try {
    // Short delay for session persistence (debugging purposes)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log('[loader] Checking authenticated user')
    const user = await getCurrentUser()
    console.log('[loader] Directly behind getCurrentUser().')    

    if (!user) {
      throw new Error('Not authenticated')
    }

    console.log('[loader] User authenticated, loading data.')
    return { todoLists: mockTodoLists, labels: availableLabels }
  } catch (err) {
    console.log('[loader] An error occurred:', err)
    return redirect('/login')
  }
}

// Utility function to find a label's color or return gray if the label doesn't exist
const getLabelColor = (labelName: string, availableLabels: Label[]): string => {
  const label = availableLabels.find((label) => label.name === labelName)
  return label ? label.color : 'gray' // Default to gray if label is not found
}

export default function Index() {
  const { todoLists, labels } = useLoaderData<{ todoLists: TodoList[]; labels: Label[] }>()

  const statuses = Object.values(TaskStatus)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My To-Do Lists</h1>

      {todoLists.map((list) => (
        <div key={list.id} className={`mb-6`}>
          <h2 className="text-xl font-semibold" style={{ color: list.color }}>
            {list.name}
          </h2>

          <div className="flex gap-4">
            {statuses.map((status) => (
              <div key={status} className="flex-1 flex flex-col border border-gray-300 p-2 rounded">
                <h3 className="text-lg font-semibold text-gray-700 mb-2 capitalize">{status}</h3>
                <ul className="flex-1">
                  {list.tasks
                    .filter((task) => task.status === status)
                    .map((task) => (
                      <li key={task.id} className="p-2 mb-2 border-b">
                        <span>{task.task}</span>
                        <span className="ml-4 text-sm text-gray-500">({task.createdAt})</span>

                        {/* Display labels next to the task */}
                        <div className="mt-1">
                          {task.labels.map((labelName) => (
                            <span
                              key={labelName}
                              className="inline-block px-2 py-1 text-xs font-medium rounded mr-2"
                              style={{ backgroundColor: getLabelColor(labelName, labels), color: 'white' }}
                            >
                              {labelName}
                            </span>
                          ))}
                        </div>
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
