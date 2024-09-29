import { useNavigation } from '@remix-run/react'
import { CirclePlus, CircleX } from 'lucide-react'
import { useState } from 'react'

import Spinner from './Spinner'
import { useTranslation } from '~/contexts/TranslationContext'
import { Label } from '~/types/dataTypes'
import { ALL_LANGUAGES, LANG_DEFAULT } from '~/utils/language'

type LabelManagerProps = {
  taskLabels: string[]
  setTaskLabels: React.Dispatch<React.SetStateAction<string[]>>
  labels: Label[]
  lang: string
}

export default function LabelManager({ taskLabels, setTaskLabels, labels, lang }: LabelManagerProps) {
  const navigation = useNavigation()

  const [newLabelNames, setNewLabelNames] = useState<{ [key: string]: string }>({})
  const [newLabelColor, setNewLabelColor] = useState('')
  const { t } = useTranslation()

  // Create a Map of labels for efficient lookup
  const labelsMap = new Map<string, Label>()
  labels.forEach((label) => labelsMap.set(label.id, label))

  const handleRemoveLabel = (labelId: string) => {
    setTaskLabels((prevLabels) => prevLabels.filter((id) => id !== labelId))
  }

  const handleAddLabel = (labelId: string) => {
    console.log('Adding label with id:', labelId)
    setTaskLabels((prevLabels) => {
      if (!prevLabels.includes(labelId)) {
        return [...prevLabels, labelId]
      }
      return prevLabels
    })
  }

  const availableLabels = labels.filter((label) => !taskLabels.includes(label.id))

  // Handle input changes for new label creation
  const handleNewLabelNameChange = (langCode: string, value: string) => {
    setNewLabelNames((prevNames) => ({ ...prevNames, [langCode]: value }))
  }

  const handleNewLabelColorChange = (value: string) => {
    setNewLabelColor(value)
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded my-4 pt-3 px-2">
      {taskLabels.length > 0 && (
        <div>
          <div className="text-xl text-gray-900 dark:text-gray-100 ml-2 mb-3">{t['labels-assigned']}</div>
          <ul className="space-y-2">
            {taskLabels.map((labelId) => {
              const label = labelsMap.get(labelId)
              if (!label) return null
              return (
                <li key={label.id} className="flex items-center space-x-2">
                  <span className="ml-4 px-2 py-1 rounded text-white" style={{ backgroundColor: label.color }}>
                    {label.displayName[lang] || label.displayName[LANG_DEFAULT]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(label.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <CircleX size={20} />
                  </button>
                </li>
              )
            })}
          </ul>

          <hr className="mt-6 mb-4 mx-2 border-gray-300 dark:border-blue-700" />
        </div>
      )}

      <div className="text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">{t['new-labels']}</div>

      <div className="mb-4">
        {availableLabels.length > 0 && (
          <div className="mb-4">
            <div className="text-gray-900 dark:text-gray-100 font-semibold ml-2 mb-2">{t['add']}:</div>

            <ul className="space-y-2">
              {availableLabels.map((label) => (
                <li key={label.id} className="flex items-center space-x-2">
                  <span className="ml-4 px-2 py-1 rounded text-white" style={{ backgroundColor: label.color }}>
                    {label.displayName[lang] || label.displayName[LANG_DEFAULT]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddLabel(label.id)}
                    className="text-green-500 hover:text-green-700"
                  >
                    <CirclePlus size={20} />
                  </button>
                </li>
              ))}
            </ul>

            <hr className="mt-6 mb-4 ml-2 w-1/4 border-gray-300 dark:border-blue-700" />
          </div>
        )}

        {/* Create New Label Section */}
        <div>
          <div className="text-gray-900 dark:text-gray-100 font-semibold ml-2 mb-2">{t['create']}:</div>

          {ALL_LANGUAGES.map((langCode) => (
            <div key={langCode} className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mx-2">
                {`${t['display-name']} (${langCode.toUpperCase()})`}
              </label>

              <input
                type="text"
                value={newLabelNames[langCode] || ''}
                onChange={(e) => handleNewLabelNameChange(langCode, e.target.value)}
                className="mt-1 ml-2 w-11/12 py-2 pl-2 border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
              />
            </div>
          ))}

          <div className="mb-2">
            <label className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t['color']}</label>
            <input
              type="text"
              value={newLabelColor}
              onChange={(e) => handleNewLabelColorChange(e.target.value)}
              placeholder="#FF0000, blue, etc."
              className="mt-1 ml-2 w-11/12 py-2 pl-2 border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            />
          </div>

          {/* Hidden inputs for new label data */}
          <input type="hidden" name="newLabelNames" value={JSON.stringify(newLabelNames)} />
          <input type="hidden" name="newLabelColor" value={newLabelColor} />

          <div className="ml-4 flex items-center space-x-4">
            <button
              type="submit"
              name="intent"
              value="addLabel"
              className={`text-gray-100 border bg-green-600 hover:bg-green-800
                border-green-600
                mt-2 px-4 py-1 rounded`}
              disabled={navigation.state === 'submitting'}
            >
              {navigation.state === 'submitting' ? <Spinner size={24} /> : t['add-new-label']}
            </button>
          </div>
        </div>
      </div>

      {/* Include hidden inputs for labelIds */}
      {taskLabels.map((labelId) => (
        <input type="hidden" name="labelIds" value={labelId} key={labelId} />
      ))}
    </div>
  )
}
