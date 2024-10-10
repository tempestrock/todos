import { useNavigation } from '@remix-run/react'
import { CirclePlus, CircleX } from 'lucide-react'
import { useEffect, useState } from 'react'

import LabelForm from '~/components/LabelForm'
import { useTranslation } from '~/contexts/TranslationContext'
import { Label } from '~/types/dataTypes'
import { LANG_DEFAULT } from '~/utils/language'

type LabelManagerProps = {
  taskLabelIds: string[]
  setTaskLabelIds: React.Dispatch<React.SetStateAction<string[]>>
  labels: Label[]
  lang: string
}

export default function LabelManager({ taskLabelIds, setTaskLabelIds, labels, lang }: LabelManagerProps) {
  const navigation = useNavigation()
  const { t } = useTranslation()
  const [currentLang, setCurrentLang] = useState(lang)

  useEffect(() => {
    const clientLang = localStorage.getItem('lang') || LANG_DEFAULT
    setCurrentLang(clientLang)
  }, [])

  const labelsMap = new Map<string, Label>()
  labels.forEach((label) => labelsMap.set(label.id, label))

  const handleRemoveLabel = (labelId: string) => {
    setTaskLabelIds((prevLabels) => prevLabels.filter((id) => id !== labelId))
  }

  const handleAddLabel = (labelId: string) => {
    setTaskLabelIds((prevLabels) => {
      if (!prevLabels.includes(labelId)) {
        return [...prevLabels, labelId]
      }
      return prevLabels
    })
  }

  const availableLabels = labels.filter((label) => !taskLabelIds.includes(label.id))

  return (
    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded my-4 pt-3 px-2">
      {/* Assigned Labels */}
      {taskLabelIds.length > 0 && (
        <div>
          <div className="text-xl text-gray-900 dark:text-gray-100 ml-2 mb-3">{t['labels-assigned']}</div>
          <ul className="space-y-2">
            {taskLabelIds
              .map((labelId) => labelsMap.get(labelId))
              .filter((label) => label !== undefined)
              .sort((a, b) => a?.displayName[currentLang].localeCompare(b?.displayName[currentLang]))
              .map((label) => {
                return (
                  <li key={label.id} className="flex items-center space-x-2">
                    <span className="ml-4 px-2 py-1 rounded text-white" style={{ backgroundColor: label.color }}>
                      {label.displayName[currentLang] || label.displayName[LANG_DEFAULT]}
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

      {/* Add Existing Label */}
      <div className="text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">{t['new-labels']}</div>

      <div className="mb-4">
        {availableLabels.length > 0 && (
          <div className="mb-4">
            <div className="text-gray-900 dark:text-gray-100 font-semibold ml-2 mb-2">{t['add']}:</div>

            <ul className="space-y-2">
              {availableLabels
                .sort((a, b) => a?.displayName[currentLang].localeCompare(b?.displayName[currentLang]))
                .map((label) => (
                  <li key={label.id} className="flex items-center space-x-2">
                    <span className="ml-4 px-2 py-1 rounded text-white" style={{ backgroundColor: label.color }}>
                      {label.displayName[currentLang] || label.displayName[LANG_DEFAULT]}
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

        {/* Create New Label */}
        <div>
          <div className="text-gray-900 dark:text-gray-100 font-semibold ml-2 mb-2">{t['create']}:</div>

          <input type="hidden" name="intent" value="addLabel" />
          <LabelForm isSubmitting={navigation.state === 'submitting'} action="addLabel" />
        </div>
      </div>

      {/* Hidden Inputs for labelIds */}
      {taskLabelIds.map((labelId) => (
        <input type="hidden" name="labelIds" value={labelId} key={labelId} />
      ))}
    </div>
  )
}
