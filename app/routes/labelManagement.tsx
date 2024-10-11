import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node'
import { useLoaderData, Form, useNavigation, useFetcher } from '@remix-run/react'
import { FilePenLine, Trash2 } from 'lucide-react'
import { useState } from 'react'

import LabelForm from '~/components/LabelForm'
import { useTranslation } from '~/contexts/TranslationContext'
import { Label } from '~/types/dataTypes'
import { requireAuth } from '~/utils/auth/session.server'
import { loadAllLabels, createLabel, updateLabel, deleteLabel } from '~/utils/database/labelOperations'
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
  const [editingLabel, setEditingLabel] = useState<Label | null>(null)

  const currentLang = typeof window !== 'undefined' ? localStorage.getItem('lang') || LANG_DEFAULT : LANG_DEFAULT

  const handleDeleteLabel = (labelId: string) => {
    if (labelCounts[labelId] > 0) return // Do nothing if the label is assigned to any task.

    if (confirm(t['confirm-label-deletion'])) {
      fetcher.submit({ intent: 'deleteLabel', labelId }, { method: 'post' })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl text-gray-900 dark:text-gray-100 font-bold mb-4">{t['labelManagement']}</h1>

      {/* Existing Labels */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t['existing-labels']}</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">{t['label']}</th>
                <th className="px-4 py-2 flex justify-center text-gray-900 dark:text-gray-100">
                  {t['label-num-tasks']}
                </th>
                <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">{t['edit']}</th>
                <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100">{t['delete']}</th>
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
                    <td className="px-4 py-2">
                      <div className="px-2 py-1 rounded text-white" style={{ backgroundColor: label.color }}>
                        {label.displayName[currentLang] || label.displayName[LANG_DEFAULT]}
                      </div>
                    </td>

                    {/* Number of tasks */}
                    <td className="px-4 py-2">
                      <div className="ml-2 text-sm text-gray-900 dark:text-gray-100 flex justify-center">
                        {labelCounts[label.id] || 0} {t['tasks']}
                      </div>
                    </td>

                    {/* Edit button */}
                    <td className="px-4 pt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setEditingLabel(label)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FilePenLine size={18} />
                      </button>
                    </td>

                    {/* Delete button */}
                    <td className="px-4 pt-2">
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
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{t['create-new-label']}</h2>
        <Form method="post">
          <input type="hidden" name="intent" value="addLabel" />
          <LabelForm isSubmitting={navigation.state === 'submitting'} action="addLabel" />
        </Form>
      </div>

      {/* Edit Label */}
      {editingLabel && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">{t['edit-label']}</h2>
          <Form method="post">
            <input type="hidden" name="intent" value="editLabel" />
            <input type="hidden" name="labelId" value={editingLabel.id} />
            <LabelForm initialData={editingLabel} isSubmitting={navigation.state === 'submitting'} action="editLabel" />
          </Form>
          <button type="button" onClick={() => setEditingLabel(null)} className="mt-2 text-gray-500">
            {t['cancel']}
          </button>
        </div>
      )}
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
    case 'editLabel': {
      const labelId = formData.get('labelId') as string
      const displayName: { [key: string]: string } = {}
      for (const lang of formData.keys()) {
        if (lang.startsWith('displayName-')) {
          const langCode = lang.split('-')[1]
          displayName[langCode] = formData.get(lang) as string
        }
      }
      const color = formData.get('color') as string
      await updateLabel(labelId, { displayName, color })
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
