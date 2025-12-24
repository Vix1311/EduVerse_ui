import Loader from '@/components/loader/Loader'
import { ReactNode } from 'react'
import { useNavigation } from 'react-router-dom'

interface IMainLayoutProps {
  children: ReactNode
}

const MainLayout = ({ children }: IMainLayoutProps) => {
  const navigation = useNavigation()

  return (
    <div className="text-default min-h-screen bg-white">
      {navigation.state === 'loading' ? <Loader /> : children}
    </div>
  )
}

export default MainLayout
