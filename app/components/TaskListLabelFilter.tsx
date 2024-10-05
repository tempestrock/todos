import { useTranslation } from '~/contexts/TranslationContext'
import { Label } from '~/types/dataTypes'
import { LANG_DEFAULT } from '~/utils/language'

type LabelFilterProps = {
  labels: Label[]
  selectedLabelIds: string[]
  setSelectedLabelIds: React.Dispatch<React.SetStateAction<string[]>>
  labelFilterVisible: boolean
  clearLabelFilters: () => void
  currentLang: string
}

export default function LabelFilter({
  labels,
  selectedLabelIds,
  setSelectedLabelIds,
  labelFilterVisible,
  clearLabelFilters,
  currentLang,
}: LabelFilterProps) {
  const { t } = useTranslation()

  const handleLabelFilterChange = (labelId: string) => {
    setSelectedLabelIds((prevSelected) => {
      if (prevSelected.includes(labelId)) {
        return prevSelected.filter((id) => id !== labelId)
      } else {
        return [...prevSelected, labelId]
      }
    })
  }

  return (
    <>
      {/* Label Filter with Transition */}
      <div
        className={`transition-all duration-100 ease-in-out overflow-hidden ${
          labelFilterVisible ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pt-20">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => clearLabelFilters()}
              className={`px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-100 dark:text-gray-100 hover:text-gray-100 dark:hover:text-gray-700 hover:bg-gray-500 text-gray-700 border-1 border-gray-900 dark:border-gray-100`}
            >
              {t['clear-filter']}
            </button>

            {labels
              .sort((a, b) => a?.displayName[currentLang].localeCompare(b?.displayName[currentLang]))
              .map((label) => (
                <button
                  key={label.id}
                  onClick={() => handleLabelFilterChange(label.id)}
                  className={`px-2 py-1 border rounded text-xs text-gray-100 transition-opacity duration-150 ${
                    selectedLabelIds.includes(label.id)
                      ? 'opacity-100 border-2 border-gray-900 dark:border-gray-100'
                      : 'opacity-50 hover:opacity-80 hover:border-gray-900 dark:hover:border-gray-100'
                  }`}
                  style={{
                    backgroundColor: label.color,
                  }}
                >
                  {label.displayName[currentLang] || label.displayName[LANG_DEFAULT]}
                </button>
              ))}
          </div>
        </div>
      </div>
    </>
  )
}
