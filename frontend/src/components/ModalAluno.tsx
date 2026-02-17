import { useState, useEffect, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import { getApiErrors, getFieldError } from '../utils/apiErrors'
import { validarEmail, validarCPF, mascaraCPF, mascaraTelefone, soNumeros } from '../utils/validacao'
import type { Aluno } from '../types'

interface ModalAlunoProps {
  aluno: Aluno | null
  onFechar: () => void
  onSalvo: () => void
}

export default function ModalAluno({ aluno, onFechar, onSalvo }: ModalAlunoProps) {
  const { t } = useTranslation()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [responsavelNome, setResponsavelNome] = useState('')
  const [responsavelCpf, setResponsavelCpf] = useState('')
  const [endereco, setEndereco] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState('')
  const [erros, setErros] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showFieldErrors, setShowFieldErrors] = useState(false)
  const isEdit = !!aluno?.id

  useEffect(() => {
    if (aluno) {
      setNome(aluno.nome || '')
      setEmail(aluno.email || '')
      setTelefone(aluno.telefone ? mascaraTelefone(aluno.telefone) : '')
      setCpf(aluno.cpf ? mascaraCPF(aluno.cpf) : '')
      setDataNascimento(aluno.dataNascimento ? aluno.dataNascimento.slice(0, 10) : '')
      setResponsavelNome(aluno.responsavelNome || '')
      setResponsavelCpf(aluno.responsavelCpf ? mascaraCPF(aluno.responsavelCpf) : '')
      setEndereco(aluno.endereco || '')
      setObservacoes(aluno.observacoes || '')
      setAtivo(aluno.ativo !== false)
    } else {
      setResponsavelNome('')
      setResponsavelCpf('')
      setAtivo(true)
    }
  }, [aluno])

  function menorDeIdade(): boolean {
    if (!dataNascimento) return false
    const d = new Date(dataNascimento + 'T12:00:00')
    if (Number.isNaN(d.getTime())) return false
    const hoje = new Date()
    let idade = hoje.getFullYear() - d.getFullYear()
    const m = hoje.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) idade--
    return idade < 18
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setErros({})
    setShowFieldErrors(false)
    const isMenor = menorDeIdade()
    const nomeVazio = !nome.trim()
    const emailVazio = !email.trim()
    const emailInvalido = !!email.trim() && !validarEmail(email)
    const cpfInvalido = !!(cpf && soNumeros(cpf).length > 0 && !validarCPF(cpf))
    const responsavelCpfInvalido = !!(responsavelCpf && soNumeros(responsavelCpf).length > 0 && !validarCPF(responsavelCpf))
    const responsavelObrigatorioVazio = isMenor && (!responsavelNome.trim() || !responsavelCpf.trim() || responsavelCpfInvalido)
    const cpfErro = isMenor ? responsavelCpfInvalido : cpfInvalido
    const temErro = nomeVazio || emailVazio || emailInvalido || cpfErro || responsavelObrigatorioVazio
    if (temErro) {
      setErro('Preencha os campos obrigatórios.')
      setShowFieldErrors(true)
      return
    }
    setLoading(true)
    const payload: Record<string, unknown> = {
      nome,
      email,
      telefone: soNumeros(telefone) || undefined,
      cpf: isMenor ? undefined : (soNumeros(cpf) || undefined),
      dataNascimento: dataNascimento || undefined,
      responsavelNome: isMenor ? (responsavelNome.trim() || undefined) : undefined,
      responsavelCpf: isMenor ? (soNumeros(responsavelCpf) || undefined) : undefined,
      endereco: endereco || undefined,
      observacoes: observacoes || undefined,
      ativo
    }
    const api = getApiClient()
    const req = isEdit ? api.put(`/alunos/${aluno!.id}`, payload) : api.post('/alunos', payload)
    req
      .then(() => onSalvo())
      .catch((err) => {
        const { mensagem, erros: apiErros } = getApiErrors(err)
        setErro(mensagem)
        setErros(apiErros)
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? t('alunos.editStudent') : t('alunos.newStudentTitle')}</h2>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {erro && <div className="alert alert-error">{erro}</div>}
          <div className={`form-group ${(showFieldErrors && !nome.trim()) || getFieldError(erros, 'nome') ? 'field-error' : ''}`}>
            <label>Nome *</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
            {getFieldError(erros, 'nome') && <span className="field-error-msg">{getFieldError(erros, 'nome')}</span>}
          </div>
          <div className="form-group">
            <label>Data de nascimento</label>
            <input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} placeholder="DD/MM/AAAA" />
          </div>
          {menorDeIdade() && (
            <div className={`form-group ${showFieldErrors && !responsavelNome.trim() ? 'field-error' : ''}`}>
              <label>Nome do responsável *</label>
              <input value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} placeholder="Nome completo" />
              {getFieldError(erros, 'responsavelNome') && <span className="field-error-msg">{getFieldError(erros, 'responsavelNome')}</span>}
            </div>
          )}
          <div
            className={`form-group ${
              (showFieldErrors && (menorDeIdade() ? responsavelCpfInvalido : (cpf && soNumeros(cpf).length > 0 && !validarCPF(cpf)))) ||
              getFieldError(erros, menorDeIdade() ? 'responsavelCpf' : 'cpf')
                ? 'field-error'
                : ''
            }`}
          >
            <label>{menorDeIdade() ? 'CPF do responsável *' : 'CPF'}</label>
            <input
              value={menorDeIdade() ? responsavelCpf : cpf}
              onChange={(e) => (menorDeIdade() ? setResponsavelCpf(mascaraCPF(e.target.value)) : setCpf(mascaraCPF(e.target.value)))}
              placeholder="000.000.000-00"
              maxLength={14}
            />
            {(getFieldError(erros, 'cpf') || getFieldError(erros, 'responsavelCpf')) && (
              <span className="field-error-msg">{getFieldError(erros, menorDeIdade() ? 'responsavelCpf' : 'cpf')}</span>
            )}
          </div>
          <div
            className={`form-group ${
              (showFieldErrors && (!email.trim() || (!!email.trim() && !validarEmail(email)))) || getFieldError(erros, 'email') ? 'field-error' : ''
            }`}
          >
            <label>E-mail *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {getFieldError(erros, 'email') && <span className="field-error-msg">{getFieldError(erros, 'email')}</span>}
          </div>
          <div className="form-group">
            <label>Telefone</label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="form-group">
            <label>Endereço</label>
            <input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Observações</label>
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
          </div>
          <div className="form-group form-group-status">
            <div className="status-ativo">
              <input
                type="checkbox"
                id="aluno-ativo"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="status-checkbox"
              />
              <label htmlFor="aluno-ativo" className="status-label">
                Aluno ativo
              </label>
            </div>
            <p className="form-hint">Desmarque para marcar o aluno como inativo.</p>
          </div>
        </form>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onFechar}>{t('common.cancel')}</button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
