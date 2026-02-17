import { useState, useEffect, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import { getApiErrors, getFieldError } from '../utils/apiErrors'
import { validarEmail, mascaraCPF, mascaraTelefone } from '../utils/validacao'
import SelectSearch from './SelectSearch'
import type { Usuario } from '../types'

function opcoesPerfil(
  isEdit: boolean,
  perfilAtual: string,
  t: (key: string) => string
): { value: 'ADMINISTRADOR' | 'PROFESSOR' | 'FUNCIONARIO'; label: string }[] {
  if (isEdit && perfilAtual === 'PROFESSOR') {
    return [{ value: 'PROFESSOR', label: t('usuarios.profileProfessor').toUpperCase() }]
  }
  return [
    { value: 'ADMINISTRADOR', label: t('usuarios.profileAdmin').toUpperCase() },
    { value: 'FUNCIONARIO', label: t('usuarios.profileFuncionario').toUpperCase() }
  ]
}

interface ModalUsuarioProps {
  usuario: Usuario | null
  onFechar: () => void
  onSalvo: () => void
}

export default function ModalUsuario({ usuario, onFechar, onSalvo }: ModalUsuarioProps) {
  const { t } = useTranslation()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [perfil, setPerfil] = useState<'ADMINISTRADOR' | 'PROFESSOR' | 'FUNCIONARIO'>('FUNCIONARIO')
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState('')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showFieldErrors, setShowFieldErrors] = useState(false)

  const isEdit = !!usuario?.id
  const isEditProfessor = isEdit && usuario?.perfil === 'PROFESSOR'

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome)
      setEmail(usuario.email)
      setSenha('')
      setPerfil(usuario.perfil)
      setAtivo(usuario.ativo ?? true)
    } else {
      setNome('')
      setEmail('')
      setSenha('')
      setPerfil('FUNCIONARIO')
      setAtivo(true)
    }
    setErro('')
    setShowFieldErrors(false)
  }, [usuario])

  function validar(): boolean {
    if (!nome.trim()) return false
    if (!email.trim()) return false
    if (!validarEmail(email)) return false
    if (!isEdit && !senha.trim()) return false
    return true
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setShowFieldErrors(true)
    setErros({})
    if (!validar()) {
      setErro('Preencha os campos obrigatórios.')
      return
    }
    setErro('')
    setLoading(true)
    const payload = { nome: nome.trim(), email: email.trim(), perfil, ativo }
    if (senha.trim()) (payload as Record<string, unknown>).senha = senha.trim()
    const req = isEdit
      ? getApiClient().put(`/usuarios/${usuario!.id}`, payload)
      : getApiClient().post('/usuarios', payload)
    req
      .then(() => onSalvo())
      .catch((err) => {
        const { mensagem, erros: apiErros } = getApiErrors(err)
        setErro(mensagem)
        setErros(apiErros ?? {})
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? t('usuarios.editUser') : t('usuarios.newUserTitle')}</h2>
          <button type="button" className="modal-close" onClick={onFechar} aria-label={t('common.closeAria')}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {erro && <div className="alert alert-error">{erro}</div>}
            <div className={`form-group ${(showFieldErrors && !nome.trim()) || getFieldError(erros, 'nome') ? 'field-error' : ''}`}>
              <label htmlFor="usuario-nome">Nome *</label>
              <input
                id="usuario-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                readOnly={isEditProfessor}
                disabled={isEditProfessor}
                className={isEditProfessor ? 'input-readonly' : ''}
              />
              {getFieldError(erros, 'nome') && <span className="field-error-msg">{getFieldError(erros, 'nome')}</span>}
            </div>
            <div className={`form-group ${(showFieldErrors && (!email.trim() || !validarEmail(email))) || getFieldError(erros, 'email') ? 'field-error' : ''}`}>
              <label htmlFor="usuario-email">E-mail *</label>
              <input
                id="usuario-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                readOnly={isEditProfessor}
                disabled={isEditProfessor}
                className={isEditProfessor ? 'input-readonly' : ''}
              />
              {getFieldError(erros, 'email') && <span className="field-error-msg">{getFieldError(erros, 'email')}</span>}
            </div>
            {isEditProfessor && (
              <>
                <div className="form-group">
                  <label htmlFor="usuario-professor-cpf">CPF</label>
                  <input
                    id="usuario-professor-cpf"
                    type="text"
                    value={usuario?.professorCpf ? mascaraCPF(usuario.professorCpf) : ''}
                    readOnly
                    disabled
                    className="input-readonly"
                    placeholder="—"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="usuario-professor-telefone">Telefone</label>
                  <input
                    id="usuario-professor-telefone"
                    type="text"
                    value={usuario?.professorTelefone ? mascaraTelefone(usuario.professorTelefone) : ''}
                    readOnly
                    disabled
                    className="input-readonly"
                    placeholder="—"
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <label htmlFor="usuario-perfil">Perfil *</label>
              <SelectSearch
                id="usuario-perfil"
                value={perfil}
                onChange={(val) => setPerfil(val as 'ADMINISTRADOR' | 'PROFESSOR' | 'FUNCIONARIO')}
                options={opcoesPerfil(isEdit, usuario?.perfil ?? '', t).map((p) => ({ value: p.value, label: p.label }))}
                placeholder="Selecione o perfil"
                disabled={isEditProfessor}
                className={`select-search-wrap--compact${isEditProfessor ? ' input-readonly' : ''}`}
                aria-label="Perfil"
              />
              {isEdit && usuario?.perfil === 'PROFESSOR' && (
                <small className="form-hint">Perfil Professor é gerenciado no cadastro de professores.</small>
              )}
            </div>
            <div className="form-group form-group-status">
              <div className="status-ativo">
                <input
                  type="checkbox"
                  id="usuario-ativo"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="status-checkbox"
                  disabled={isEditProfessor}
                />
                <label htmlFor="usuario-ativo" className="status-label">
                  Usuário ativo (pode acessar o sistema)
                </label>
              </div>
              {!isEditProfessor && <p className="form-hint">Desmarque para marcar o usuário como inativo.</p>}
              {isEditProfessor && (
                <p className="form-hint">Para usuário Professor, apenas a senha pode ser alterada aqui. Demais dados são gerenciados no cadastro de professores.</p>
              )}
            </div>
            <div className={`form-group ${(showFieldErrors && !isEdit && !senha.trim()) || getFieldError(erros, 'senha') ? 'field-error' : ''}`}>
              <label htmlFor="usuario-senha">Senha {isEdit ? '' : '*'}</label>
              <input
                id="usuario-senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={isEdit ? 'Deixe em branco para manter' : 'Senha'}
              />
              {getFieldError(erros, 'senha') && <span className="field-error-msg">{getFieldError(erros, 'senha')}</span>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onFechar}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
