import { useUserRole } from '@/hooks/useUserRole'
import { Navigate } from 'react-router-dom'
import { ReactNode } from 'react'

export default function AdminGuard({ children }: { children: ReactNode }) {
  const roles = useUserRole()
  const role =
    typeof roles === 'string' ? roles : (roles as { role?: string })?.role ?? ''
  if (role !== 'admin') return <Navigate to="/unauthorized" />
  return <>{children}</>
}
