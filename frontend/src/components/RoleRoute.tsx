import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Perfil = 'ADMINISTRADOR' | 'PROFESSOR' | 'FUNCIONARIO'

interface RoleRouteProps {
  allowed: Perfil[]
  children: React.ReactNode
}

export default function RoleRoute({ allowed, children }: RoleRouteProps) {
  const { user } = useAuth()
  const perfil = user?.perfil as Perfil | undefined
  if (!perfil || !allowed.includes(perfil)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
