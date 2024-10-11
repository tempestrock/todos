import { Link } from '@remix-run/react'
import { Home } from 'lucide-react'

import Spinner from '~/components/Spinner'

type HomeButtonProps = {
  loadingHome: boolean
  handleHomeClick: () => void
}

const HomeButton: React.FC<HomeButtonProps> = ({ loadingHome, handleHomeClick }) => {
  return (
    <Link to="/" className="text-xs text-blue-500 hover:text-blue-700" onClick={handleHomeClick}>
      {loadingHome ? <Spinner size={24} lightModeColor="text-blue-500" /> : <Home size={24} />}
    </Link>
  )
}

export default HomeButton
