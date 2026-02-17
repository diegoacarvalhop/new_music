import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ModalPresencasProfessor from './ModalPresencasProfessor'
import './Layout.scss'

const ROTAS_PROFESSOR = ['/turmas']

const navItemsAdmin = [
  { path: '/', i18nKey: 'nav.home' },
  { path: '/alunos', i18nKey: 'nav.alunos' },
  { path: '/professores', i18nKey: 'nav.professores' },
  { path: '/instrumentos', i18nKey: 'nav.instrumentos' },
  { path: '/turmas', i18nKey: 'nav.turmas' },
  { path: '/matriculas', i18nKey: 'nav.matriculas' },
  { path: '/financeiro', i18nKey: 'nav.financeiro' },
  { path: '/declaracoes', i18nKey: 'nav.declaracoes' },
  { path: '/relatorios', i18nKey: 'nav.relatorios' },
  { path: '/usuarios', i18nKey: 'nav.usuarios' },
]

const navItemsFuncionario = [
  { path: '/', i18nKey: 'nav.home' },
  { path: '/alunos', i18nKey: 'nav.alunos' },
  { path: '/professores', i18nKey: 'nav.professores' },
  { path: '/instrumentos', i18nKey: 'nav.instrumentos' },
  { path: '/turmas', i18nKey: 'nav.turmas' },
  { path: '/matriculas', i18nKey: 'nav.matriculas' },
  { path: '/financeiro', i18nKey: 'nav.financeiro' },
  { path: '/declaracoes', i18nKey: 'nav.declaracoes' },
  { path: '/relatorios', i18nKey: 'nav.relatorios' },
]

const navItemsProfessor = [
  { path: '/turmas', i18nKey: 'nav.turmas' },
  { i18nKey: 'nav.presencasProfessor', action: 'presencas' as const },
]

const LANGUAGES = [
  { code: 'pt-BR', label: '🇧🇷' },
  { code: 'en', label: '🇺🇸' },
  { code: 'es', label: '🇪🇸' },
] as const

export default function Layout() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)

  const navItems = user?.perfil === 'PROFESSOR'
    ? navItemsProfessor
    : user?.perfil === 'ADMINISTRADOR'
      ? navItemsAdmin
      : navItemsFuncionario

  const [mostrarPresencasModal, setMostrarPresencasModal] = useState(false)

  useEffect(() => {
    if (user?.perfil === 'PROFESSOR' && location.pathname === '/') {
      navigate('/turmas', { replace: true })
      return
    }
    if (user?.perfil === 'PROFESSOR' && !ROTAS_PROFESSOR.includes(location.pathname)) {
      navigate('/turmas', { replace: true })
    }
    if (user?.perfil === 'FUNCIONARIO' && location.pathname === '/usuarios') {
      navigate('/', { replace: true })
    }
  }, [user?.perfil, location.pathname, navigate])

  useEffect(() => {
    if (navOpen) setNavOpen(false)
  }, [location.pathname])

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-brand">
          <Link to="/" className="layout-brand-link">
            <img src="/Logo%20Branco.png" alt="NEW MUSIC" className="layout-logo" />
          </Link>
        </div>
        <button
          type="button"
          className="layout-nav-toggle"
          onClick={() => setNavOpen((o) => !o)}
          aria-expanded={navOpen}
          aria-label={t('nav.menu')}
        >
          <span className="layout-nav-toggle-bar" />
          <span className="layout-nav-toggle-bar" />
          <span className="layout-nav-toggle-bar" />
        </button>
        <nav className={`layout-nav ${navOpen ? 'layout-nav-open' : ''}`}>
          {navItems.map((item) => {
            if ('path' in item && item.path) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`layout-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                >
                  {t(item.i18nKey)}
                </Link>
              )
            }
            if ('action' in item && item.action === 'presencas') {
              return (
                <button
                  key={item.i18nKey}
                  type="button"
                  className="layout-nav-link layout-nav-link-button"
                  onClick={() => setMostrarPresencasModal(true)}
                >
                  {t(item.i18nKey)}
                </button>
              )
            }
            return null
          })}
        </nav>
        <div className="layout-user">
          <select
            className="layout-lang-select"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            aria-label={t('common.language')}
            title={t('common.language')}
          >
            {LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
          <button
            type="button"
            className="layout-theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? t('common.themeLight') : t('common.themeDark')}
            aria-label={theme === 'dark' ? t('common.themeLightAria') : t('common.themeDarkAria')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span className="layout-user-name">{user?.nome || user?.email}</span>
          <span className="layout-perfil">{user?.perfil ? t(user.perfil === 'ADMINISTRADOR' ? 'usuarios.profileAdmin' : `usuarios.profile${user.perfil.charAt(0) + user.perfil.slice(1).toLowerCase()}`).toUpperCase() : ''}</span>
          <button type="button" className="btn btn-sm layout-btn-sair" onClick={logout}>{t('common.logout')}</button>
        </div>
      </header>
      <main className="layout-main">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer className="layout-footer">
        <span className="layout-footer-text">
          {t('footer.appName')} {t('footer.copyright', { year: new Date().getFullYear() })}
        </span>
      </footer>
      {user?.perfil === 'PROFESSOR' && user?.professorId != null && mostrarPresencasModal && (
        <ModalPresencasProfessor
          professorId={user.professorId}
          professorNome={user.nome ?? ''}
          ano={new Date().getFullYear()}
          mes={new Date().getMonth() + 1}
          podeAlterar={false}
          onFechar={() => setMostrarPresencasModal(false)}
        />
      )}
    </div>
  )
}
