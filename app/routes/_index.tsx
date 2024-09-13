import { LoaderFunction } from '@remix-run/node'
import { Form, json, useLoaderData } from '@remix-run/react'

import { availableLabels, Label, mockTodoLists, TaskStatus } from '~/data/mockdata'
import { LoaderData } from '~/types/loaderData'
import { authAction } from '~/utils/authActions'
import { requireAuth } from '~/utils/session.server'

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireAuth(request)
  return json<LoaderData>({
    user,
    todoLists: mockTodoLists,
    labels: availableLabels,
  })
}

// Utility function to find a label's color or return gray if the label doesn't exist
const getLabelColor = (labelName: string, availableLabels: Label[]): string => {
  const label = availableLabels.find((label) => label.name === labelName)
  return label ? label.color : 'gray' // Default to gray if label is not found
}

export const action = authAction

export default function Index() {
  const { todoLists, labels } = useLoaderData<LoaderData>()

  const statuses = Object.values(TaskStatus)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My To-Do Lists</h1>
      {/* <p>Welcome, {user?.attributes.username}</p> */}

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

      <Form method="post">
        <input type="hidden" name="action" value="signout" />
        <button className="text-lg border border-gray-700 bg-gray-100 px-2 pb-1" type="submit">
          Sign Out
        </button>
      </Form>
    </div>
  )
}
