import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import { getApiErrors } from '../utils/apiErrors'
import './Login.scss'

const baseURL = '/api'

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token.trim()) setErro('Link inválido. Solicite uma nova redefinição de senha.')
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    if (novaSenha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${baseURL}/auth/redefinir-senha`, { token, novaSenha })
      setSucesso(true)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      setErro(getApiErrors(err).mensagem)
    } finally {
      setLoading(false)
    }
  }

  if (!token.trim()) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <img src="/Logo%20Preto.png" alt="NEW MUSIC" className="login-logo" />
            <p>Redefinir senha</p>
          </div>
          <div className="login-form">
            <div className="alert alert-error">{erro}</div>
            <p className="login-footer">
              <Link to="/esqueci-senha">Solicitar novo link</Link> · <Link to="/login">Voltar ao login</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <img src="/Logo%20Preto.png" alt="NEW MUSIC" className="login-logo" />
            <p>Senha alterada</p>
          </div>
          <div className="login-form">
            <div className="alert alert-success">Senha alterada com sucesso. Redirecionando para o login...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src="/Logo%20Preto.png" alt="NEW MUSIC" className="login-logo" />
          <p>Nova senha</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {erro && <div className="alert alert-error">{erro}</div>}
          <div className="form-group">
            <label htmlFor="novaSenha">Nova senha *</label>
            <input
              id="novaSenha"
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmarSenha">Confirmar senha *</label>
            <input
              id="confirmarSenha"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Repita a senha"
            />
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </button>
          <p className="login-footer">
            <Link to="/login">Voltar ao login</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
