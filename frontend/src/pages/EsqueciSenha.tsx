import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { getApiErrors } from '../utils/apiErrors'
import './Login.scss'

const baseURL = '/api'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    if (!email.trim()) {
      setErro('Informe seu e-mail.')
      return
    }
    setLoading(true)
    try {
      const { data } = await axios.post<{ mensagem?: string }>(`${baseURL}/auth/esqueci-senha`, { email: email.trim() })
      setSucesso(data?.mensagem ?? 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.')
      setEmail('')
    } catch (err) {
      setErro(getApiErrors(err).mensagem)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src="/Logo%20Preto.png" alt="NEW MUSIC" className="login-logo" />
          <p>Recuperação de senha</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          {erro && <div className="alert alert-error">{erro}</div>}
          {sucesso && <div className="alert alert-success">{sucesso}</div>}
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
              disabled={!!sucesso}
            />
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={loading || !!sucesso}>
            {loading ? 'Enviando...' : 'Enviar link'}
          </button>
          <p className="login-footer">
            <Link to="/login">Voltar ao login</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
