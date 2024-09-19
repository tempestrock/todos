import { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
import { Form, json, useLoaderData, Link } from '@remix-run/react'

import { loadListMetadata } from '~/database/loadListMetadata'
import { loadUser } from '~/database/loadUser'
import { Label, TaskList, User } from '~/types/dataTypes'
import { authAction } from '~/utils/authAction'
import { printObject } from '~/utils/printObject'
import { requireAuth } from '~/utils/session.server'

/**
 * Displays the home page which shows all todo lists for the given user.
 */

export type LoaderData = {
  user?: User
  todoLists: TaskList[]
  labels: Label[]
  success: boolean
}

let todoLists: TaskList[] | undefined = undefined
let user: User | undefined = undefined

/**
 * Is called with every page load.
 * Loads all tasks from the database.
 * @param request - The request object
 */
export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  console.log('[_index.loader] starting')
  printObject(request, '[_index.loader] request')
  printObject(params, '[_index.loader] params')

  const userId = await requireAuth(request)
  // printObject(user, '[_index.loader] user')

  try {
    if (!user) {
      user = await loadUser(userId)
      // printObject(user, '[_index.loader] user')
      if (!user) throw new Error('[_index.loader] Failed to load user')
      // } else {
      //   console.log(`[_index.loader] user already loaded`)
    }

    if (user.taskListIds.length === 0) throw new Error('[_index.loader] User has no lists')

    // Only load the part of the lists that is necessary to show the list names and colors on the home page.
    if (!todoLists) {
      todoLists = await loadListMetadata(user.taskListIds)
      todoLists.sort((a, b) => a.position - b.position)

      printObject(todoLists, '[_index.loader] todoLists')
    } else {
      console.log(`[_index.loader] todoLists already loaded`)
    }

    return json<LoaderData>({ success: true, todoLists, user, labels: [] })
  } catch (error) {
    console.error('[_index.loader] Error loading tasks:', error)
    return json<LoaderData>({ success: false, todoLists: [], user: undefined, labels: [] })
  }
}

export default function HomeView() {
  // Get the necessary data from the loader.
  const { todoLists, user, success } = useLoaderData<LoaderData>()

  if (success)
    return (
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          <h1 className="text-2xl font-bold mb-4">{user?.displayName}'s Lists</h1>

          {/* Sign out button */}
          <Form method="post">
            <input type="hidden" name="action" value="signout" />
            <button className="text-xs border border-gray-700 mt-1 bg-gray-100 pt-1 px-2 pb-1" type="submit">
              Sign out
            </button>
          </Form>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {todoLists.map((list) => (
            <Link
              key={list.id}
              to={`/${list.id}`}
              className="w-full text-white text-2xl py-4 rounded block text-center"
              style={{ backgroundColor: list.color }}
            >
              {list.displayName}
            </Link>
          ))}
        </div>
      </div>
    )
  else return <div className="text-5xl text-red-600 flex justify-center items-center h-screen">Failed to load 😵</div>
}

export const action = authAction
