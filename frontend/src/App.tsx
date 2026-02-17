import { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { setApiGetAuth } from './api/client'
import Layout from './components/Layout'
import RoleRoute from './components/RoleRoute'

function DashboardOrRedirect() {
  const { user } = useAuth()
  if (user?.perfil === 'PROFESSOR') return <Navigate to="/turmas" replace />
  return <Dashboard />
}

const Login = lazy(() => import('./pages/Login'))
const EsqueciSenha = lazy(() => import('./pages/EsqueciSenha'))
const RedefinirSenha = lazy(() => import('./pages/RedefinirSenha'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Alunos = lazy(() => import('./pages/Alunos'))
const Professores = lazy(() => import('./pages/Professores'))
const Instrumentos = lazy(() => import('./pages/Instrumentos'))
const Turmas = lazy(() => import('./pages/Turmas'))
const Matriculas = lazy(() => import('./pages/Matriculas'))
const Financeiro = lazy(() => import('./pages/Financeiro'))
const Usuarios = lazy(() => import('./pages/Usuarios'))
const Relatorios = lazy(() => import('./pages/Relatorios'))
const Declaracoes = lazy(() => import('./pages/Declaracoes'))

const ADMIN_FUNCIONARIO = ['ADMINISTRADOR', 'FUNCIONARIO'] as const
const ADMIN_ONLY = ['ADMINISTRADOR'] as const
const ALL_LOGGED = ['ADMINISTRADOR', 'PROFESSOR', 'FUNCIONARIO'] as const

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { getAuth } = useAuth()

  useEffect(() => {
    setApiGetAuth(getAuth)
  }, [getAuth])

  return (
    <Suspense fallback={<div className="app-loading">Carregando...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<RoleRoute allowed={[...ALL_LOGGED]}><DashboardOrRedirect /></RoleRoute>} />
          <Route path="alunos" element={<RoleRoute allowed={[...ADMIN_FUNCIONARIO]}><Alunos /></RoleRoute>} />
          <Route path="professores" element={<RoleRoute allowed={[...ADMIN_FUNCIONARIO]}><Professores /></RoleRoute>} />
          <Route path="instrumentos" element={<RoleRoute allowed={[...ADMIN_FUNCIONARIO]}><Instrumentos /></RoleRoute>} />
          <Route path="turmas" element={<RoleRoute allowed={[...ALL_LOGGED]}><Turmas /></RoleRoute>} />
          <Route path="matriculas" element={<RoleRoute allowed={[...ADMIN_FUNCIONARIO]}><Matriculas /></RoleRoute>} />
          <Route path="financeiro" element={<RoleRoute allowed={[...ADMIN_FUNCIONARIO]}><Financeiro /></RoleRoute>} />
          <Route path="usuarios" element={<RoleRoute allowed={[...ADMIN_ONLY]}><Usuarios /></RoleRoute>} />
          <Route path="relatorios" element={<RoleRoute allowed={[...ADMIN_FUNCIONARIO]}><Relatorios /></RoleRoute>} />
          <Route path="declaracoes" element={<RoleRoute allowed={[...ADMIN_FUNCIONARIO]}><Declaracoes /></RoleRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
