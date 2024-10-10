import { useEffect, useState } from 'react'

import Spinner from '~/components/Spinner'
import { useTranslation } from '~/contexts/TranslationContext'
import { ALL_LANGUAGES } from '~/utils/language'

/**
 * A form to create a completely new label.
 */

type LabelFormProps = {
  initialData?: {
    displayName: { [key: string]: string }
    color: string
  }
  isSubmitting: boolean
  action: 'addLabel' | 'editLabel'
}

export default function LabelForm({ initialData, isSubmitting, action }: LabelFormProps) {
  const { t } = useTranslation()
  const [labelNames, setLabelNames] = useState<{ [key: string]: string }>(initialData?.displayName || {})
  const [labelColor, setLabelColor] = useState(initialData?.color || '')
  const [isFormValid, setIsFormValid] = useState(false)

  useEffect(() => {
    const areAllNamesFilled = ALL_LANGUAGES.every((lang) => labelNames[lang] && labelNames[lang].trim() !== '')
    const isColorFilled = labelColor.trim() !== ''
    setIsFormValid(areAllNamesFilled && isColorFilled)
  }, [labelNames, labelColor])

  const handleLabelNameChange = (langCode: string, value: string) => {
    setLabelNames((prevNames) => ({ ...prevNames, [langCode]: value }))
  }

  const handleLabelColorChange = (value: string) => {
    setLabelColor(value)
  }

  return (
    <>
      {ALL_LANGUAGES.map((langCode) => (
        <div key={langCode} className="mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mx-2">
            {`${t['display-name']} (${langCode.toUpperCase()})`}
          </label>
          <input
            type="text"
            name={`displayName-${langCode}`}
            value={labelNames[langCode] || ''}
            onChange={(e) => handleLabelNameChange(langCode, e.target.value)}
            className="mt-1 ml-2 w-11/12 py-2 pl-2 border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
          />
        </div>
      ))}

      <div className="mb-2">
        <label className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t['color']}</label>
        <input
          type="text"
          name="color"
          value={labelColor}
          onChange={(e) => handleLabelColorChange(e.target.value)}
          placeholder="#FF0000, blue, etc."
          className="mt-1 ml-2 w-11/12 py-2 pl-2 border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
        />
      </div>

      {/* Hidden inputs for new label data */}
      <input type="hidden" name="labelNames" value={JSON.stringify(labelNames)} />
      <input type="hidden" name="labelColor" value={labelColor} />

      <div className="ml-4 flex items-center space-x-4">
        <button
          type="submit"
          name="intent"
          value={action}
          className={`mt-2 px-4 py-1 rounded border
            ${
              !isFormValid || isSubmitting
                ? 'text-gray-500 bg-gray-400 dark:bg-gray-700 border-gray-400 cursor-not-allowed'
                : 'text-gray-100 bg-green-600 hover:bg-green-800 border-green-600'
            }`}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? <Spinner size={24} /> : t[action === 'addLabel' ? 'add-new-label' : 'edit-label']}
        </button>
      </div>
    </>
  )
}
