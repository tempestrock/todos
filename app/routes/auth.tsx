import { json, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
import { useActionData, useLoaderData, Form, redirect } from '@remix-run/react'

import { User } from '~/types/dataTypes'
import { getCurrentUser } from '~/utils/auth'
import { authAction, ActionData } from '~/utils/authActions'
import { printObject } from '~/utils/printObject'

export type LoaderData = {
  user: User
  success: boolean
}

export const loader: LoaderFunction = async ({ params }: LoaderFunctionArgs) => {
  console.log('[auth.loader] starting')
  printObject(params, '[auth.loader] params')

  try {
    const user = await getCurrentUser()
    if (user) {
      // If the user is authenticated, redirect to the home page.
      return redirect('/')
    }
    return json({ success: true, user: null })
  } catch {
    return json({ success: false, user: null })
  }
}

export const action = authAction

export default function Auth() {
  const { user } = useLoaderData<LoaderData>()
  const actionData = useActionData<ActionData>()

  return (
    <div>
      <h1>Authentication</h1>
      {user ? (
        <div>
          <p>Huhu, {user.displayName}</p>
          <Form method="post">
            <input type="hidden" name="action" value="signout" />
            <button type="submit">Sign Out</button>
          </Form>
        </div>
      ) : (
        <div>
          <h2 className='text-xl mb-2'>Please login first.</h2>
          <Form method="post">
            <input type="hidden" name="action" value="signin" />
            <input type="text" name="username" placeholder="Username" required />
            <input type="password" name="password" placeholder="Password" required />
            <button className="text-xs border border-gray-700 mt-1 bg-gray-100 pt-1 px-2 pb-1" type="submit">Sign In</button>
          </Form>
        </div>
      )}
      {actionData?.error && <p>Error: {actionData.error}</p>}
    </div>
  )
}
