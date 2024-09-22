import { LoaderCircle } from 'lucide-react'

type SpinnerProps = {
  size?: number // Optional size prop
  lightModeColor?: string // Text color for light mode
  darkModeColor?: string // Text color for dark mode
}

const Spinner = ({ size = 36, lightModeColor = 'text-gray-900', darkModeColor = 'text-gray-100' }: SpinnerProps) => {
  return (
    <div className="flex justify-center items-center h-full">
      <LoaderCircle
        className={`animate-spin ${lightModeColor} dark:${darkModeColor}`} // Apply color based on light or dark mode.
        style={{ width: size, height: size }} // Dynamically set width and height.
      />
    </div>
  )
}

export default Spinner
