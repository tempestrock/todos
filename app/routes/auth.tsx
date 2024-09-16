import { json, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
import { useActionData, useLoaderData, Form, redirect } from '@remix-run/react'

import { LoaderData } from '~/types/loaderData'
import { getCurrentUser } from '~/utils/auth'
import { authAction, ActionData } from '~/utils/authActions'
import { printObject } from '~/utils/printObject'

export const loader: LoaderFunction = async ({ request, params }: LoaderFunctionArgs) => {
  console.log('[auth.loader] starting')
  printObject(request, '[auth.loader] request')
  printObject(params, '[auth.loader] params')

  try {
    const user = await getCurrentUser()
    if (user) {
      // If the user is authenticated, redirect to the home page.
      return redirect('/')
    }
    return json({ user: null })
  } catch {
    return json({ user: null })
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
          <p>Huhu, {user.cognitoUser.username}</p>
          <Form method="post">
            <input type="hidden" name="action" value="signout" />
            <button type="submit">Sign Out</button>
          </Form>
        </div>
      ) : (
        <div>
          <h2>Sign In</h2>
          <Form method="post">
            <input type="hidden" name="action" value="signin" />
            <input type="text" name="username" placeholder="Username" required />
            <input type="password" name="password" placeholder="Password" required />
            <button type="submit">Sign In</button>
          </Form>
        </div>
      )}
      {actionData?.error && <p>Error: {actionData.error}</p>}
    </div>
  )
}
