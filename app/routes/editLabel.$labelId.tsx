/* eslint-disable @typescript-eslint/only-throw-error */
import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node'
import { useLoaderData, Form, useNavigation, useNavigate } from '@remix-run/react'

import LabelForm from '~/components/LabelForm'
import { useTranslation } from '~/contexts/TranslationContext'
import { Label } from '~/types/dataTypes'
import { requireAuth } from '~/utils/auth/session.server'
import { loadLabel, updateLabel } from '~/utils/database/labelOperations'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth(request)
  const { labelId } = params
  if (!labelId) {
    throw new Response('Label ID is required', { status: 400 })
  }
  const label = await loadLabel(labelId)
  if (!label) {
    throw new Response('Label not found', { status: 404 })
  }
  return json({ label })
}

export default function EditLabel() {
  const { label } = useLoaderData<{ label: Label }>()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Handler for the 'Cancel' button
  const handleCancel = () => {
    navigate('/labelManagement')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Title */}
      <h1 className="text-gray-900 dark:text-gray-100 text-2xl font-bold mb-4">{t['edit-label']}</h1>

      {/* Edit Label Form */}
      <Form method="post">
        <LabelForm
          initialData={label}
          isSubmitting={navigation.state === 'submitting'}
          action="editLabel"
          onCancel={handleCancel} // Pass the onCancel handler
        />
      </Form>
    </div>
  )
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireAuth(request)
  const { labelId } = params
  if (!labelId) {
    throw new Response('Label ID is required', { status: 400 })
  }
  const formData = await request.formData()
  const intent = formData.get('intent')

  switch (intent) {
    case 'editLabel': {
      // Collect display names for all languages
      const displayName: { [key: string]: string } = {}
      for (const key of formData.keys()) {
        if (key.startsWith('displayName-')) {
          const langCode = key.split('-')[1]
          displayName[langCode] = formData.get(key) as string
        }
      }
      const color = formData.get('color') as string
      await updateLabel(labelId, { displayName, color })
      return redirect('/labelManagement')
    }

    default:
      return null
  }
}
