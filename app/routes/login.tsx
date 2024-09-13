import { useState } from 'react'
import { useNavigate } from '@remix-run/react'
import { Amplify } from 'aws-amplify'
import { signIn } from '@aws-amplify/auth'
import awsconfig from '../aws-exports'

// Configure Amplify with aws-exports
Amplify.configure(awsconfig)

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Handle login using Amplify's signIn method
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      // Amplify Gen 2 signIn expects a single object parameter
      const user = await signIn({ username, password })
      console.log('Logged in user:', user)
      navigate('/') // Redirect to home page after successful login
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Authentication failed')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      {error && <p className="text-red-600">{error}</p>}
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
    </div>
  )
}
