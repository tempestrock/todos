import { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
import { json, useLoaderData, Link } from '@remix-run/react'
import { useState } from 'react'

import MoreMenu from '~/components/MoreMenu'
import Spinner from '~/components/Spinner'
import { useTranslation } from '~/contexts/TranslationContext'
import { Label, TaskList, User } from '~/types/dataTypes'
import { authAction } from '~/utils/auth/authAction'
import { requireAuth } from '~/utils/auth/session.server'
import { loadListMetadata } from '~/utils/database/loadListMetadata'
import { loadUser } from '~/utils/database/loadUser'
import { log } from '~/utils/log'

export type LoaderData = {
  user?: User
  todoLists: TaskList[]
  labels: Label[]
  success: boolean
}

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireAuth(request)

  try {
    const user = await loadUser(userId)
    if (!user) throw new Error('[_index.loader] Failed to load user')

    const todoLists = await loadListMetadata(user.taskListIds)
    todoLists.sort((a, b) => a.position - b.position)

    return json<LoaderData>({ success: true, todoLists, user, labels: [] })
  } catch (error) {
    log('[_index.loader] Error loading tasks:', error)
    return json<LoaderData>({ success: false, todoLists: [], user: undefined, labels: [] })
  }
}

export default function HomeView() {
  const { todoLists, user, success } = useLoaderData<LoaderData>()
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
  else return <div className="text-5xl text-red-600 flex justify-center items-center h-screen">Failed to load 😵</div>
}

export const action = authAction
