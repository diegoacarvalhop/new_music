import { useState, FormEvent } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { getApiClient } from '../api/client'
import './Login.scss'

export default function Login() {
  const { t } = useTranslation()
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [lembrarMe, setLembrarMe] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const { data } = await getApiClient().post<{ accessToken: string; refreshToken: string; id: number; email: string; nome: string; perfil: string; professorId?: number | null }>('/auth/login', { email, senha })
      login(data, lembrarMe)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && err.response && 'data' in err.response && err.response.data && typeof (err.response.data as { mensagem?: string }).mensagem === 'string'
        ? (err.response.data as { mensagem: string }).mensagem
        : t('auth.invalidCredentials')
      setErro(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src="/Logo%20Preto.png" alt="NEW MUSIC" className="login-logo" />
          <p>{t('auth.loginWithEmail')}</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {erro && <div className="alert alert-error">{erro}</div>}
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="senha">{t('auth.password')}</label>
            <div className="password-input-wrapper">
              <input
                id="senha"
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                tabIndex={-1}
              >
                <span className={`password-toggle-icon ${showPassword ? 'visible' : ''}`} aria-hidden>
                  <svg className="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg className="icon-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
          <div className="form-group form-group-checkbox">
            <label>
              <input
                type="checkbox"
                checked={lembrarMe}
                onChange={(e) => setLembrarMe(e.target.checked)}
              />
              {t('auth.rememberMe')}
            </label>
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? t('auth.loggingIn') : t('auth.login')}
          </button>
          <p className="login-footer">
            <Link to="/esqueci-senha">{t('auth.forgotPassword')}</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
