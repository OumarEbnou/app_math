import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { FullPageLoader } from '../components/FullPageLoader'
import { useAuth } from '../hooks/useAuth'
import type { AppRole } from '../types/auth'
import { getHomePath, isRoleAllowed } from '../utils/accessControl'

interface ProtectedRouteProps {
  allowedRoles: readonly AppRole[]
  children: ReactNode
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { status, user, profile } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <FullPageLoader label="Vérification de votre session…" />
  }

  if (!user || !profile) {
    return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  }

  if (!isRoleAllowed(profile.role, allowedRoles)) {
    return <Navigate to="/interdit" replace state={{ home: getHomePath(profile.role) }} />
  }

  return children
}
