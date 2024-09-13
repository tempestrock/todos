import { json, LoaderFunction, ActionFunction } from '@remix-run/node'
import { useActionData, useLoaderData, Form, redirect } from '@remix-run/react'

import { signIn, signOut, getCurrentUser } from '~/utils/auth'

// Define the type for our loader data
type LoaderData = {
  user: {
    attributes: {
      email: string
    }
  } | null
}

export const loader: LoaderFunction = async () => {
  try {
    const user = await getCurrentUser()
    if (user) {
      // If the user is authenticated, redirect to the home page
      return redirect('/')
    }
    return json({ user: null })
  } catch {
    return json({ user: null })
  }
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const action = formData.get('action')
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  try {
    switch (action) {
      // case 'signup':
      //   await signUp(username, password)
      //   return json({ success: true, action: 'signup' })
      case 'signin':
        await signIn(username, password)
        return redirect('/')
      // return json({ success: true, action: 'signin' })
      case 'signout':
        signOut()
        return json({ success: true, action: 'signout' })
      default:
        return json({ success: false, error: 'Invalid action' })
    }
  } catch (error: any) {
    return json({ success: false, error: error.message })
  }
}

export default function Auth() {
  const loaderData = useLoaderData<LoaderData>()
  const actionData = useActionData()

  return (
    <div>
      <h1>Authentication</h1>
      {loaderData.user ? (
        <div>
          <p>Welcome, {loaderData.user.attributes.email}</p>
          <Form method="post">
            <input type="hidden" name="action" value="signout" />
            <button type="submit">Sign Out</button>
          </Form>
        </div>
      ) : (
        <div>
          {/* <h2>Sign Up</h2>
          <Form method="post">
            <input type="hidden" name="action" value="signup" />
            <input type="text" name="username" placeholder="Username" required />
            <input type="password" name="password" placeholder="Password" required />
            <button type="submit">Sign Up</button>
          </Form> */}

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
