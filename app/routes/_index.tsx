import { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
import { json, useLoaderData, Link } from '@remix-run/react'
import { useState } from 'react'

import MoreMenu from '~/components/MoreMenu'
import Spinner from '~/components/Spinner'
import { useTranslation } from '~/contexts/TranslationContext'
import { TaskList, User } from '~/types/dataTypes'
import { authAction } from '~/utils/auth/authAction'
import { requireAuth } from '~/utils/auth/requireAuth'
import { loadListMetadata } from '~/utils/database/taskListOperations'
import { loadUser } from '~/utils/database/userOperations'
import { log } from '~/utils/log'

export type LoaderData = {
  user?: User
  todoLists: TaskList[]
  success: boolean
  errorMsg?: string
}

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const authResult = await requireAuth(request)
  const userId = authResult.username

  try {
    const user = await loadUser(userId)
    if (!user) {
      // The user in Cognito is not defined in the 'Users' table.
      return json<LoaderData>(
        {
          success: false,
          errorMsg: `User '${userId}' is authenticated, but cannot be found in the database. Please add them to the 'Users' table.`,
          todoLists: [],
        },
        { headers: authResult.headers }
      )
    }

    const todoLists = await loadListMetadata(user.taskListIds)
    todoLists.sort((a, b) => a.position - b.position)

    return json<LoaderData>({ success: true, todoLists, user }, { headers: authResult.headers })
  } catch (error: any) {
    log('[_index.loader] Error loading tasks:', error)
    return json<LoaderData>(
      { success: false, errorMsg: error.toString(), todoLists: [] },
      { headers: authResult.headers }
    )
  }
}

export default function HomeView() {
  const { todoLists, user, success, errorMsg } = useLoaderData<LoaderData>()
  const { t } = useTranslation()
  const [loadingListId, setLoadingListId] = useState<string | null>(null)

  const handleClick = (listId: string) => {
    setLoadingListId(listId)
  }

  if (success)
    return (
      <div className="container mx-auto p-4 mt-1 dark:bg-gray-900 dark:text-gray-100">
        <div className="flex justify-between mb-4">
          {/* Title */}
          <h1 className="text-2xl font-bold mb-4">
            {user?.displayName}
            {t['users-lists']}
          </h1>

          {/* 'More' Menu */}
          <MoreMenu hasSignOutButton={true} />
        </div>

        {/* List of todo list buttons. Lists get the defined colors. When clicking a list, it changes to gray. */}
        <div className="grid grid-cols-1 gap-4">
          {todoLists.map((list) => (
            <Link
              key={list.id}
              to={`/${list.id}`}
              className={`w-full text-white text-2xl py-4 rounded block text-center transition-all duration-200 ease-in-out relative overflow-hidden group`}
              style={{
                backgroundColor: loadingListId ? (loadingListId === list.id ? '#444444' : list.color) : list.color,
              }}
              onClick={() => handleClick(list.id)}
            >
              {loadingListId === list.id ? (
                <Spinner lightModeColor="text-gray-100" />
              ) : (
                <span className="relative z-10">{list.displayName}</span>
              )}
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-25 transition-opacity duration-200 ease-in-out"></div>
            </Link>
          ))}
        </div>
      </div>
    )
  else
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="flex text-5xl text-red-600 mb-4">Failed to load 😵</div>
        <div className="mx-4 text-base text-gray-900">{errorMsg}</div>
      </div>
    )
}

export const action = authAction
