import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node'
import { useLoaderData, Form, useNavigation, useFetcher } from '@remix-run/react'
import { useState } from 'react'

import LabelForm from '~/components/LabelForm'
import { useTranslation } from '~/contexts/TranslationContext'
import { Label } from '~/types/dataTypes'
import { requireAuth } from '~/utils/auth/session.server'
import { loadAllLabels, createLabel, updateLabel, deleteLabel } from '~/utils/database/labelOperations'
import { LANG_DEFAULT } from '~/utils/language'

type LoaderData = {
  labels: Label[]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuth(request)
  const labels = await loadAllLabels()

  return json<LoaderData>({ labels })
}

export default function LabelManagement() {
  const { labels } = useLoaderData<LoaderData>()
  const navigation = useNavigation()
  const fetcher = useFetcher()
  const { t } = useTranslation()
  const [editingLabel, setEditingLabel] = useState<Label | null>(null)

  const currentLang = typeof window !== 'undefined' ? localStorage.getItem('lang') || LANG_DEFAULT : LANG_DEFAULT

  const handleDeleteLabel = (labelId: string) => {
    if (confirm(t['confirm-label-deletion'])) {
      fetcher.submit({ intent: 'deleteLabel', labelId }, { method: 'post' })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{t['label-management']}</h1>

      {/* Existing Labels */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{t['existing-labels']}</h2>
        <ul className="space-y-2">
          {labels
            .sort((a, b) =>
              a && b && a.displayName[currentLang]
                ? a.displayName[currentLang].localeCompare(b.displayName[currentLang])
                : -1
            )
            .map((label) => (
              <li key={label.id} className="flex items-center space-x-4">
                <span className="px-2 py-1 rounded text-white" style={{ backgroundColor: label.color }}>
                  {label.displayName[currentLang] || label.displayName[LANG_DEFAULT]}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingLabel(label)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  {t['edit-label']}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteLabel(label.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  {t['delete-label']}
                </button>
              </li>
            ))}
        </ul>
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
      return redirect('/label-management')
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
      return redirect('/label-management')
    }
    case 'deleteLabel': {
      const labelId = formData.get('labelId') as string
      await deleteLabel(labelId)
      return redirect('/label-management')
    }
    default:
      return null
  }
}
