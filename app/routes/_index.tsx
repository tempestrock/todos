import { ActionFunction, LoaderFunction, redirect } from '@remix-run/node'
import { Form, json, useLoaderData, Link } from '@remix-run/react'

import { loadListMetadata } from '~/data/loadListMetadata'
import { LoaderData } from '~/types/loaderData'
import { printObject } from '~/utils/printObject'
import { requireAuth } from '~/utils/session.server'

/**
 * Is called with every page load.
 * Loads all tasks from the database.
 * @param request - The request object
 */
export const loader: LoaderFunction = async ({ request, params }) => {
  printObject(request, '[_index.loader] request')
  printObject(params, '[_index.loader] params')

  const user = await requireAuth(request)
  // printObject(user, '[_index.loader] user')

  try {
    // Only load the part of the lists that is necessary to show the list names and colors on the home page.
    const todoLists = await loadListMetadata()
    printObject(todoLists, '[_index.loader] todoLists')

    return json<LoaderData>({ todoLists, user, labels: [] })
  } catch (error) {
    console.error('[_index.loader] Error loading tasks:', error)
    return json({ error: '[_index.loader] Failed to load list metadata' }, { status: 500 })
  }
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const actionType = formData.get('action')
  console.log(`[_index.action] Action type ${actionType?.toString()}' but nothing to do.`)

  return redirect(`/`)
}

export default function HomeView() {
  // Get the necessary data from the loader.
  const { todoLists, user } = useLoaderData<LoaderData>()

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-2 gap-4">
        <h1 className="text-2xl font-bold mb-4">{user?.cognitoUser.username}'s lists</h1>

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
            className="w-full text-white text-lg py-4 rounded block text-center"
            style={{ backgroundColor: list.color }}
          >
            {list.name}
          </Link>
        ))}
      </div>
    </div>
  )
  // }
}
