import { Link } from '@remix-run/react'
import { Home } from 'lucide-react'
import { useState } from 'react'

import Spinner from '~/components/Spinner'

type HomeButtonProps = unknown

const HomeButton: React.FC<HomeButtonProps> = () => {
  const [loadingHome, setLoadingHome] = useState<boolean>(false)

  const handleHomeClick = () => {
    setLoadingHome(true)
  }

  return (
    <Link to="/" className="text-xs text-blue-500 hover:text-blue-700" onClick={handleHomeClick}>
      {loadingHome ? <Spinner size={24} lightModeColor="text-blue-500" /> : <Home size={24} />}
    </Link>
  )
}

export default HomeButton
