import { Form } from '@remix-run/react'
import { SquareMenu } from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'

import DarkModeToggle from '~/components/DarkModeToggle'
import { LanguageSwitcher } from '~/components/LanguageSwitcher'
import { useTranslation } from '~/contexts/TranslationContext'

/**
 * Component to show the 'more' menu on the top right of the home screen.
 * @returns The MoreMenu component.
 */

const MoreMenu: React.FC = () => {
  const { t } = useTranslation()

  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Close the menu if the user clicks outside of it.
    const handleClickOutside = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  return (
    <div className="flex gap-4 mt-2">
      <div className="relative" ref={menuRef}>
        <button onClick={() => setMenuOpen(!menuOpen)} aria-haspopup="true" aria-expanded={menuOpen}>
          <SquareMenu
            size={24}
            className="text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400"
          />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
            <div className="py-1">
              {/* Language switcher */}
              <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-900">
                <LanguageSwitcher />
              </div>

              {/* Dark mode toggle */}
              <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-900">
                <DarkModeToggle />
              </div>

              {/* Sign out button */}
              <Form method="post">
                <input type="hidden" name="action" value="signout" />
                <button
                  className="block w-full text-left px-4 py-2 text-base text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900"
                  type="submit"
                >
                  {t['sign-out']}
                </button>
              </Form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MoreMenu
