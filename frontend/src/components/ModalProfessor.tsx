import { useState, useEffect, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import { validarEmail, validarCPF, mascaraCPF, mascaraTelefone, soNumeros } from '../utils/validacao'
import SelectSearch from './SelectSearch'
import type { Professor } from '../types'

const DIAS_OPCOES = [
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' }
]

const HORARIOS_FAIXA = [
  { value: '08:00-09:00', label: 'de 8h às 9h' },
  { value: '09:00-10:00', label: 'de 9h às 10h' },
  { value: '10:00-11:00', label: 'de 10h às 11h' },
  { value: '11:00-12:00', label: 'de 11h às 12h' },
  { value: '13:00-14:00', label: 'de 13h às 14h' },
  { value: '14:00-15:00', label: 'de 14h às 15h' },
  { value: '15:00-16:00', label: 'de 15h às 16h' },
  { value: '16:00-17:00', label: 'de 16h às 17h' },
  { value: '17:00-18:00', label: 'de 17h às 18h' },
  { value: '19:00-20:00', label: 'de 19h às 20h' },
  { value: '20:00-21:00', label: 'de 20h às 21h' }
]

const NOME_DIA_TO_VALUE: Record<string, number> = { Segunda: 1, Terça: 2, Quarta: 3, Quinta: 4, Sexta: 5 }

interface SlotDisponibilidade {
  diaSemana: number
  horario: string
}

function parseDisponibilidade(str: string | null | undefined): SlotDisponibilidade[] {
  if (!str || !str.trim()) return []
  const slots: SlotDisponibilidade[] = []
  const partes = str.split(',').map((s) => s.trim()).filter(Boolean)
  for (const p of partes) {
    const mFaixa = p.match(/^(\d+)-(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/)
    if (mFaixa) {
      slots.push({ diaSemana: Number(mFaixa[1]), horario: `${mFaixa[2]}-${mFaixa[3]}` })
      continue
    }
    const mAntigo = p.match(/^(\d+)-(\d{1,2}:\d{2})$/)
    if (mAntigo) {
      const h = mAntigo[2]
      const [hour] = h.split(':').map(Number)
      const fim = `${String(hour + 1).padStart(2, '0')}:00`
      slots.push({ diaSemana: Number(mAntigo[1]), horario: `${h}-${fim}` })
      continue
    }
    const mAntigoNome = p.match(/^(Segunda|Terça|Quarta|Quinta|Sexta)\s+(\d{1,2})h(?:\d{2})?$/)
    if (mAntigoNome && NOME_DIA_TO_VALUE[mAntigoNome[1]] != null) {
      const hora = mAntigoNome[2].padStart(2, '0')
      const fim = `${String(parseInt(hora, 10) + 1).padStart(2, '0')}:00`
      slots.push({ diaSemana: NOME_DIA_TO_VALUE[mAntigoNome[1]], horario: `${hora}:00-${fim}` })
    }
  }
  return slots
}

function formatSlotLabel(s: SlotDisponibilidade): string {
  const dia = DIAS_OPCOES.find((d) => d.value === s.diaSemana)
  const diaLabel = dia ? dia.label : `Dia ${s.diaSemana}`
  if (s.horario.includes('-')) {
    const [inicio, fim] = s.horario.split('-')
    return `${diaLabel} ${inicio.replace(':', 'h')} às ${fim.replace(':', 'h')}`
  }
  return `${diaLabel} ${s.horario.replace(':', 'h')}`
}

function disponibilidadeParaBackend(slots: SlotDisponibilidade[]): string {
  if (!slots.length) return ''
  return slots.map((s) => `${s.diaSemana}-${s.horario}`).join(',')
}

interface ModalProfessorProps {
  professor: Professor | null
  onFechar: () => void
  onSalvo: () => void
}

export default function ModalProfessor({ professor, onFechar, onSalvo }: ModalProfessorProps) {
  const { t } = useTranslation()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cpf, setCpf] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [instrumentoId, setInstrumentoId] = useState('')
  const [selectedInstrumentoLabel, setSelectedInstrumentoLabel] = useState('')
  const [listaInstrumentos, setListaInstrumentos] = useState<string[]>([])
  const [slotsDisponibilidade, setSlotsDisponibilidade] = useState<SlotDisponibilidade[]>([])
  const [novoDia, setNovoDia] = useState(1)
  const [novoHorario, setNovoHorario] = useState('08:00-09:00')
  const [ativo, setAtivo] = useState(true)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [showFieldErrors, setShowFieldErrors] = useState(false)

  const isEdit = !!professor?.id

  useEffect(() => {
    if (!grupoId) {
      setInstrumentoId('')
      setSelectedInstrumentoLabel('')
    }
  }, [grupoId])

  useEffect(() => {
    if (professor) {
      setNome(professor.nome || '')
      setEmail(professor.email || '')
      setTelefone(professor.telefone ? mascaraTelefone(professor.telefone) : '')
      setCpf(professor.cpf ? mascaraCPF(professor.cpf) : '')
      setSlotsDisponibilidade(parseDisponibilidade(professor.disponibilidade || ''))
      setAtivo(professor.ativo !== false)
      if (professor.instrumentos) {
        setListaInstrumentos(professor.instrumentos.split(',').map((s) => s.trim()).filter(Boolean))
      } else {
        setListaInstrumentos([])
      }
    } else {
      setListaInstrumentos([])
      setSlotsDisponibilidade([])
    }
  }, [professor])

  function adicionarInstrumento(e?: React.MouseEvent) {
    e?.preventDefault?.()
    const id = instrumentoId === '' ? null : Number(instrumentoId)
    if (id == null || id === 0 || !selectedInstrumentoLabel?.trim()) return
    if (listaInstrumentos.some((n) => n === selectedInstrumentoLabel.trim())) return
    setListaInstrumentos((prev) => [...prev, selectedInstrumentoLabel.trim()])
    setInstrumentoId('')
    setSelectedInstrumentoLabel('')
  }

  function removerInstrumento(nomeInst: string) {
    setListaInstrumentos((prev) => prev.filter((n) => n !== nomeInst))
  }

  function adicionarHorario(e?: React.MouseEvent) {
    e?.preventDefault?.()
    const key = `${novoDia}-${novoHorario}`
    if (slotsDisponibilidade.some((s) => `${s.diaSemana}-${s.horario}` === key)) return
    setSlotsDisponibilidade((prev) => [...prev, { diaSemana: Number(novoDia), horario: novoHorario }])
  }

  const horarioOpcoes = HORARIOS_FAIXA

  function removerHorario(index: number) {
    setSlotsDisponibilidade((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setShowFieldErrors(false)
    const nomeVazio = !nome.trim()
    const emailVazio = !email.trim()
    const emailInvalido = !!email.trim() && !validarEmail(email)
    const cpfInvalido = !!(cpf && soNumeros(cpf).length > 0 && !validarCPF(cpf))
    const senhaVazia = !isEdit && !senha.trim()
    const semInstrumento = listaInstrumentos.length === 0
    const semDisponibilidade = slotsDisponibilidade.length === 0
    const temErro =
      nomeVazio ||
      emailVazio ||
      emailInvalido ||
      cpfInvalido ||
      senhaVazia ||
      semInstrumento ||
      semDisponibilidade
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
      cpf: soNumeros(cpf) || undefined,
      instrumentos: listaInstrumentos.length ? listaInstrumentos.join(', ') : undefined,
      disponibilidade: disponibilidadeParaBackend(slotsDisponibilidade) || undefined,
      ativo
    }
    if (!isEdit && senha) payload.senha = senha
    const api = getApiClient()
    const req = isEdit ? api.put(`/professores/${professor!.id}`, payload) : api.post('/professores', payload)
    req
      .then(() => onSalvo())
      .catch((err) => setErro((err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem || 'Erro ao salvar.'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? t('professores.editProfessor') : t('professores.newProfessorTitle')}</h2>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {erro && <div className="alert alert-error">{erro}</div>}
          <div className={`form-group ${showFieldErrors && !nome.trim() ? 'field-error' : ''}`}>
            <label>Nome *</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div
            className={`form-group ${
              showFieldErrors && (!email.trim() || (!!email.trim() && !validarEmail(email))) ? 'field-error' : ''
            }`}
          >
            <label>E-mail *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-row">
            <div
              className={`form-group ${
                showFieldErrors && cpf && soNumeros(cpf).length > 0 && !validarCPF(cpf) ? 'field-error' : ''
              }`}
            >
              <label>CPF</label>
              <input
                value={cpf}
                onChange={(e) => setCpf(mascaraCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div className={`form-group ${showFieldErrors && listaInstrumentos.length === 0 ? 'field-error' : ''}`}>
            <label>Instrumentos que leciona *</label>
            <p className="form-hint">Você pode adicionar mais de um grupo/instrumento.</p>
            <div className="form-row form-row-inline">
              <div className="form-group form-group-inline">
                <label className="small">Grupo</label>
                <SelectSearch
                  value={grupoId}
                  onChange={(val) => setGrupoId(val)}
                  searchUrl="/grupos"
                  placeholder="Selecione o grupo"
                  emptyOption={{ value: '', label: 'Selecione o grupo' }}
                />
              </div>
              <div className="form-group form-group-inline">
                <label className="small">Instrumento</label>
                <SelectSearch
                  value={instrumentoId}
                  onChange={(val, label) => {
                    setInstrumentoId(val)
                    setSelectedInstrumentoLabel(label ?? '')
                  }}
                  searchUrl="/instrumentos"
                  extraParams={grupoId ? { grupoId } : {}}
                  disabled={!grupoId}
                  placeholder="Selecione"
                  emptyOption={{ value: '', label: 'Selecione' }}
                />
              </div>
              <button
                type="button"
                className="btn-add-instrumento"
                onClick={adicionarInstrumento}
                disabled={!instrumentoId}
                title="Adicionar instrumento"
              >
                <span className="btn-add-icon">+</span>
                <span className="btn-add-label">Adicionar instrumento</span>
              </button>
            </div>
            {listaInstrumentos.length > 0 && (
              <ul className="lista-tags" style={{ marginTop: '0.5rem' }}>
                {listaInstrumentos.map((n) => (
                  <li key={n} className="tag-item">
                    <span>{n}</span>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => removerInstrumento(n)}>×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={`form-group ${showFieldErrors && slotsDisponibilidade.length === 0 ? 'field-error' : ''}`}>
            <label>Disponibilidade (dias e horários) *</label>
            <p className="form-hint">Selecione um ou mais dias e horários em que está disponível.</p>
            <div className="form-row form-row-inline">
              <div className="form-group form-group-inline">
                <label className="small">Dia</label>
                <SelectSearch
                  value={String(novoDia)}
                  onChange={(val) => setNovoDia(Number(val) || 1)}
                  options={DIAS_OPCOES.map((d) => ({ value: String(d.value), label: d.label }))}
                  placeholder="Dia"
                  aria-label="Dia"
                  className="select-search-wrap--compact"
                />
              </div>
              <div className="form-group form-group-inline">
                <label className="small">Horário</label>
                <SelectSearch
                  value={novoHorario}
                  onChange={(val) => setNovoHorario(val)}
                  options={horarioOpcoes.map((h) => ({ value: h.value, label: h.label }))}
                  placeholder="Horário"
                  aria-label="Horário"
                  className="select-search-wrap--compact"
                />
              </div>
              <button
                type="button"
                className="btn-add-instrumento"
                onClick={adicionarHorario}
                title="Adicionar horário"
              >
                <span className="btn-add-icon">+</span>
                <span className="btn-add-label">Adicionar horário</span>
              </button>
            </div>
            {slotsDisponibilidade.length > 0 && (
              <ul className="lista-tags lista-horarios" style={{ marginTop: '0.5rem' }}>
                {slotsDisponibilidade.map((s, idx) => (
                  <li key={`${s.diaSemana}-${s.horario}-${idx}`} className="tag-item">
                    <span>{formatSlotLabel(s)}</span>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => removerHorario(idx)}>×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="form-group form-group-status">
            <div className="status-ativo">
              <input
                type="checkbox"
                id="professor-ativo"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="status-checkbox"
              />
              <label htmlFor="professor-ativo" className="status-label">
                Professor ativo (pode lecionar e acessar o sistema)
              </label>
            </div>
            <p className="form-hint">Desmarque para marcar o professor como inativo.</p>
          </div>
          {!isEdit && (
            <div className={`form-group ${showFieldErrors && !senha.trim() ? 'field-error' : ''}`}>
              <label htmlFor="professor-senha">Senha *</label>
              <input
                id="professor-senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                required
                placeholder="Senha para login no sistema"
              />
            </div>
          )}
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
