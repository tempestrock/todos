import { Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(isDarkMode)
    updateTheme(isDarkMode)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    updateTheme(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
  }

  const updateTheme = (isDarkMode: boolean) => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="relative inline-flex items-center h-6 rounded-full w-11 mt-1 border border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-gray-100 dark:bg-indigo-600"
    >
      <span className="sr-only">Toggle dark mode</span>
      <span
        className={`${
          darkMode ? 'translate-x-6' : 'translate-x-1'
        } inline-block w-4 h-4 transform bg-gray-100 dark:bg-indigo-600 rounded-full transition-transform duration-200 ease-in-out`}
      />
      <Sun
        className="absolute left-1 top-1/2 -translate-y-1/2 w-3 h-3 text-yellow-700 transition-opacity duration-200 ease-in-out"
        style={{ opacity: darkMode ? 0 : 1 }}
      />
      <Moon
        className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-200 transition-opacity duration-200 ease-in-out"
        style={{ opacity: darkMode ? 1 : 0 }}
      />
    </button>
  )
}

export default DarkModeToggle
