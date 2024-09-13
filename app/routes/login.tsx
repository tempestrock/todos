import { useState } from 'react'
import { useNavigate } from '@remix-run/react'
import { Amplify } from 'aws-amplify'
import { signIn, signOut, confirmSignIn } from '@aws-amplify/auth'
import awsconfig from '../aws-exports'

// // Configure Amplify
// Amplify.configure(awsconfig)

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('') // For new password
  const [showNewPassword, setShowNewPassword] = useState(false) // Show new password form
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Handle login
  const handleLogin = async (event: React.FormEvent) => {
    console.log(`[handleLogin] Starting.`)
    event.preventDefault()

    try {
      console.log(`[handleLogin] Signing in with username: ${username}`)
      const result = await signIn({ username, password })
      console.log(`[handleLogin] Signed in, result:`, result)

      // Check for the next sign-in step
      if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        console.log('[handleLogin] New password required.')
        setShowNewPassword(true)
      } else {
        // Log the result to check if the user is fully signed in
        console.log('[handleLogin] No additional steps, navigating to home page.')

        // Navigating to home page if authentication is successful
        console.log('[handleLogin] Navigating to home page.')
        window.location.href = '/' // Force redirect to home page
      }
    } catch (err: any) {
      console.error('[handleLogin] Login error:', err)
      setError(err.message || 'Authentication failed')
    }
  }

  // Handle new password submission

  const handleNewPasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      console.log(`[handleNewPasswordSubmit] newPassword: ${newPassword}`)
      // Pass the username and the new password to confirmSignIn
      await confirmSignIn({
        challengeResponse: newPassword, // The new password entered by the user
      })
      navigate('/')
    } catch (err: any) {
      console.error('New password submission error:', err)
      setError(err.message || 'Failed to set new password')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      {error && <p className="text-red-600">{error}</p>}

      {!showNewPassword ? (
        <form onSubmit={handleLogin}>
          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded mt-4">
            Login
          </button>
        </form>
      ) : (
        <form onSubmit={handleNewPasswordSubmit}>
          <div>
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Enter your new password"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded mt-4">
            Set New Password
          </button>
        </form>
      )}
    </div>
  )
}
