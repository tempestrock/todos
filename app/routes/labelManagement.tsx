import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node'
import { useLoaderData, Form, useNavigation, useFetcher, Link } from '@remix-run/react'
import { Trash2 } from 'lucide-react'

import HomeButton from '~/components/HomeButton'
import LabelForm from '~/components/LabelForm'
import MoreMenu from '~/components/MoreMenu'
import { useTranslation } from '~/contexts/TranslationContext'
import { Label } from '~/types/dataTypes'
import { requireAuth } from '~/utils/auth/session.server'
import { loadAllLabels, createLabel, deleteLabel } from '~/utils/database/labelOperations'
import { getTaskCountByLabelId, getTaskCountsByLabelIds } from '~/utils/database/taskOperations'
import { LANG_DEFAULT } from '~/utils/language'

type LoaderData = {
  labels: Label[]
  labelCounts: { [labelId: string]: number }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuth(request)
  const labels = await loadAllLabels()
  const labelIds = labels.map((label) => label.id)
  const labelCounts = await getTaskCountsByLabelIds(labelIds)

  return json<LoaderData>({ labels, labelCounts })
}

export default function LabelManagement() {
  const { labels, labelCounts } = useLoaderData<LoaderData>()
  const navigation = useNavigation()
  const fetcher = useFetcher()
  const { t } = useTranslation()

  const currentLang = typeof window !== 'undefined' ? localStorage.getItem('lang') || LANG_DEFAULT : LANG_DEFAULT

  const handleDeleteLabel = (labelId: string) => {
    if (labelCounts[labelId] > 0) return // Do nothing if the label is assigned to any task.

    if (confirm(t['confirm-label-deletion'])) {
      fetcher.submit({ intent: 'deleteLabel', labelId }, { method: 'post' })
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 z-10 shadow-md">
        <div className="container mx-auto pt-4 pb-3 px-6 flex justify-between items-center">
          {/* Home Button */}
          <HomeButton />

          {/* 'More' Menu */}
          <MoreMenu hasAddButton={false} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pt-16 px-4">
        {/* Title */}
        <div className="pt-2">
          <h1 className="pl-2 text-2xl text-gray-900 dark:text-gray-100 font-bold mb-4">{t['label-management']}</h1>
        </div>

        {/* Existing Labels */}
        <div className="mb-8">
          <h2 className="ml-4 text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t['existing-labels']}</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">{t['label']}</th>
                  <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">{t['label-num-tasks']}</th>
                  <th className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">{t['delete']}</th>
                </tr>
              </thead>
              <tbody>
                {labels
                  .sort((a, b) =>
                    a && b && a.displayName[currentLang]
                      ? a.displayName[currentLang].localeCompare(b.displayName[currentLang])
                      : -1
                  )
                  .map((label) => (
                    <tr key={label.id} className="border-b border-gray-200 dark:border-gray-700">
                      {/* Label name and color */}
                      <Link to={`/editLabel/${label.id}`}>
                        <td className="px-4 py-2">
                          <div
                            className={`px-2 py-1 rounded text-white hover:opacity-50`}
                            style={{ backgroundColor: label.color }}
                          >
                            {label.displayName[currentLang] || label.displayName[LANG_DEFAULT]}
                          </div>
                        </td>
                      </Link>

                      {/* Number of tasks */}
                      <td className="px-4 py-2 text-center">
                        <div className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                          {labelCounts[label.id] || 0} {t['tasks']}
                        </div>
                      </td>

                      {/* Delete button */}
                      <td className="px-4 pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteLabel(label.id)}
                          className={`text-red-500 hover:text-red-700 ${
                            labelCounts[label.id] > 0 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={labelCounts[label.id] > 0}
                          title={labelCounts[label.id] > 0 ? t['label-assigned-to-task'] : undefined}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add New Label */}
        <div className="ml-2 mb-8">
          <h2 className="text-gray-900 dark:text-gray-100 text-xl font-semibold mb-2">{t['create-new-label']}</h2>
          <Form method="post">
            <input type="hidden" name="intent" value="addLabel" />
            <LabelForm isSubmitting={navigation.state === 'submitting'} action="addLabel" />
          </Form>
        </div>
      </div>
    </div>
  )
}

export const action = async ({ request }: ActionFunctionArgs) => {
  await requireAuth(request)
  const formData = await request.formData()
  const intent = formData.get('intent')

  switch (intent) {
    case 'addLabel': {
      const displayName: { [key: string]: string } = {}
      for (const lang of formData.keys()) {
        if (lang.startsWith('displayName-')) {
          const langCode = lang.split('-')[1]
          displayName[langCode] = formData.get(lang) as string
        }
      }
      const color = formData.get('color') as string
      await createLabel({ displayName, color })
      return redirect('/labelManagement')
    }

    case 'deleteLabel': {
      const labelId = formData.get('labelId') as string
      // Enforce server-side check to prevent deletion if label is assigned to tasks
      const taskCount = await getTaskCountByLabelId(labelId)
      if (taskCount > 0) {
        return json({ error: 'Cannot delete a label that is assigned to tasks.' }, { status: 400 })
      }
      await deleteLabel(labelId)
      return redirect('/labelManagement')
    }

    default:
      return null
  }
}
