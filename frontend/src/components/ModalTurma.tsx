import { useState, useEffect, useMemo, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import SelectSearch from './SelectSearch'
import type { Turma } from '../types'
import type { Professor } from '../types'

const DIAS_OPCOES = [
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' }
]

interface SlotDisponibilidade {
  diaSemana: number
  horario: string
}

const NOME_DIA_TO_VALUE: Record<string, number> = { Segunda: 1, Terça: 2, Quarta: 3, Quinta: 4, Sexta: 5 }

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
    const mAntigoNome = p.match(/^(Segunda|Terça|Quarta|Quinta|Sexta)\s+(\d{1,2})h(?:\d{2})?$/i)
    if (mAntigoNome) {
      const nomeDia = mAntigoNome[1].charAt(0).toUpperCase() + mAntigoNome[1].slice(1).toLowerCase()
      const diaValue = NOME_DIA_TO_VALUE[nomeDia]
      if (diaValue != null) {
        const hora = mAntigoNome[2].padStart(2, '0')
        const fim = `${String(parseInt(hora, 10) + 1).padStart(2, '0')}:00`
        slots.push({ diaSemana: diaValue, horario: `${hora}:00-${fim}` })
      }
    }
  }
  return slots
}

function horarioInicioDoSlot(horario: string): string {
  if (horario.includes('-')) return horario.split('-')[0]
  return horario
}

function horarioFimDoSlot(horario: string): string {
  if (horario.includes('-')) {
    const p = horario.split('-')
    return p[p.length - 1] || ''
  }
  return ''
}

function formatSlotLabel(s: SlotDisponibilidade): string {
  const dia = DIAS_OPCOES.find((d) => d.value === s.diaSemana)
  const diaLabel = dia ? dia.label : `Dia ${s.diaSemana}`
  if (s.horario.includes('-')) {
    const [inicio, fim] = s.horario.split('-')
    return `${diaLabel} - ${inicio.replace(':', 'h')} às ${fim.replace(':', 'h')}`
  }
  return `${diaLabel} - ${s.horario.replace(':', 'h')}`
}

function slotKey(s: SlotDisponibilidade): string {
  return `${s.diaSemana}-${horarioInicioDoSlot(s.horario)}`
}

interface ModalTurmaProps {
  turma: Turma | null
  onFechar: () => void
  onSalvo: () => void
}

export interface SlotSelecionado {
  diaSemana: number
  horarioInicio: string
  horarioFim?: string
}

export default function ModalTurma({ turma, onFechar, onSalvo }: ModalTurmaProps) {
  const { t } = useTranslation()
  const [slotsSelecionados, setSlotsSelecionados] = useState<SlotSelecionado[]>([])
  const [capacidade, setCapacidade] = useState<string | number>('')
  const [grupoId, setGrupoId] = useState('')
  const [instrumentoId, setInstrumentoId] = useState<string | number>('')
  const [professorId, setProfessorId] = useState<string | number>('')
  const [ativo, setAtivo] = useState(true)
  const [instrumentos, setInstrumentos] = useState<{ id: number; nome: string }[]>([])
  const [todosProfessores, setTodosProfessores] = useState<Professor[]>([])
  const [professorDetalhe, setProfessorDetalhe] = useState<Professor | null>(null)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [showFieldErrors, setShowFieldErrors] = useState(false)
  const [professorQuery, setProfessorQuery] = useState('')
  const [professorDropdownOpen, setProfessorDropdownOpen] = useState(false)

  const isEdit = !!turma?.id

  useEffect(() => {
    getApiClient().get<Professor[]>('/professores/ativos').then((r) => setTodosProfessores(r.data))
  }, [])

  useEffect(() => {
    if (!professorId) {
      setProfessorDetalhe(null)
      return
    }
    const id = Number(professorId)
    const daLista = todosProfessores.find((p) => p.id === id)
    if (daLista?.disponibilidade != null && daLista.disponibilidade.trim() !== '') {
      setProfessorDetalhe(daLista)
      return
    }
    getApiClient()
      .get<Professor>(`/professores/${id}`)
      .then((r) => setProfessorDetalhe(r.data))
      .catch(() => setProfessorDetalhe(daLista ?? null))
  }, [professorId, todosProfessores])

  useEffect(() => {
    if (!grupoId) {
      setInstrumentos([])
      setInstrumentoId('')
      return
    }
    getApiClient().get<{ id: number; nome: string }[]>('/instrumentos/ativos', { params: { grupoId } })
      .then((r) => {
        setInstrumentos(r.data)
        setInstrumentoId((id: string | number) => {
          const aindaValido = r.data.some((i) => i.id === id)
          return aindaValido ? id : ''
        })
      })
      .catch(() => setInstrumentos([]))
  }, [grupoId])

  const handleGrupoChange = (val: string) => {
    setGrupoId(val)
    setInstrumentoId('')
  }

  const handleInstrumentoChange = (val: string) => {
    setInstrumentoId(val || '')
  }

  const instrumentoNome = useMemo(() => {
    if (!instrumentoId) return ''
    const inst = instrumentos.find((i) => i.id === Number(instrumentoId))
    return inst?.nome ?? ''
  }, [instrumentoId, instrumentos])

  const professoresFiltrados = useMemo(() => {
    if (!instrumentoNome.trim()) return []
    return todosProfessores.filter((p) => {
      const lista = (p.instrumentos ?? '').split(',').map((s) => s.trim()).filter(Boolean)
      return lista.some((nome) => nome.toLowerCase() === instrumentoNome.toLowerCase())
    })
  }, [todosProfessores, instrumentoNome])

  const professoresParaLista = useMemo(() => {
    const q = professorQuery.trim().toLowerCase()
    if (!q) return professoresFiltrados
    return professoresFiltrados.filter((p) => (p.nome ?? '').toLowerCase().includes(q))
  }, [professoresFiltrados, professorQuery])

  const professorSelecionado = professorDetalhe ?? professoresFiltrados.find((p) => p.id === Number(professorId))

  const slotsProfessor = useMemo(() => {
    const slots = parseDisponibilidade(professorSelecionado?.disponibilidade)
    return slots.sort((a, b) => {
      if (a.diaSemana !== b.diaSemana) return a.diaSemana - b.diaSemana
      return horarioInicioDoSlot(a.horario).localeCompare(horarioInicioDoSlot(b.horario))
    })
  }, [professorSelecionado])

  useEffect(() => {
    setProfessorQuery('')
  }, [instrumentoId])

  useEffect(() => {
    if (!instrumentoNome) return
    const aindaNaLista = professoresFiltrados.some((p) => p.id === Number(professorId))
    if (!aindaNaLista && professoresFiltrados.length && !isEdit) {
      setProfessorId(professoresFiltrados[0].id)
    }
  }, [instrumentoNome, professoresFiltrados, professorId, isEdit])

  useEffect(() => {
    if (!isEdit && professorId) setSlotsSelecionados([])
  }, [professorId, isEdit])

  useEffect(() => {
    if (turma) {
      const slots: SlotSelecionado[] = []
      if (turma.horarios && turma.horarios.length > 0) {
        for (const h of turma.horarios) {
          const hi = h.horarioInicio ? String(h.horarioInicio).slice(0, 5) : '08:00'
          const hf = h.horarioFim ? String(h.horarioFim).slice(0, 5) : undefined
          slots.push({ diaSemana: h.diaSemana, horarioInicio: hi, ...(hf && { horarioFim: hf }) })
        }
      } else if (turma.diaSemana != null && turma.horarioInicio != null) {
        const hi = String(turma.horarioInicio).slice(0, 5)
        slots.push({ diaSemana: turma.diaSemana, horarioInicio: hi })
      }
      setSlotsSelecionados(slots)
      setCapacidade(turma.capacidade ?? '')
      setInstrumentoId(turma.instrumentoId || '')
      setProfessorId(turma.professorId || '')
      setAtivo(turma.ativo !== false)
      if (turma.instrumentoGrupoId) {
        setGrupoId(String(turma.instrumentoGrupoId))
      } else if (turma.instrumentoId) {
        getApiClient().get<{ id: number; grupoId?: number }[]>('/instrumentos/ativos').then((r) => {
          const inst = r.data.find((i) => i.id === turma.instrumentoId)
          if (inst?.grupoId) setGrupoId(String(inst.grupoId))
        })
      }
    } else {
      setGrupoId('')
      setInstrumentoId('')
      setProfessorId('')
      setSlotsSelecionados([])
      setAtivo(true)
    }
  }, [turma])

  function isSlotSelecionado(s: SlotDisponibilidade): boolean {
    const key = slotKey(s)
    const hi = horarioInicioDoSlot(s.horario)
    return slotsSelecionados.some((sel) => sel.diaSemana === s.diaSemana && sel.horarioInicio === hi)
  }

  function toggleSlot(s: SlotDisponibilidade) {
    const hi = horarioInicioDoSlot(s.horario)
    const hf = horarioFimDoSlot(s.horario)
    const slot: SlotSelecionado = { diaSemana: s.diaSemana, horarioInicio: hi, ...(hf && { horarioFim: hf }) }
    setSlotsSelecionados((prev) => {
      const ja = prev.some((sel) => sel.diaSemana === s.diaSemana && sel.horarioInicio === hi)
      if (ja) return prev.filter((sel) => !(sel.diaSemana === s.diaSemana && sel.horarioInicio === hi))
      return [...prev, slot]
    })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setShowFieldErrors(false)
    const grupoVazio = !grupoId
    const instrumentoVazio = !instrumentoId
    const professorVazio = !professorId
    const semHorario = slotsSelecionados.length === 0
    const capNum = Number(capacidade)
    const capacidadeVazia = !capNum || capNum < 1
    const temErro = grupoVazio || instrumentoVazio || professorVazio || semHorario || capacidadeVazia
    if (temErro) {
      setErro('Preencha os campos obrigatórios.')
      setShowFieldErrors(true)
      return
    }
    setLoading(true)
    const norm = (h: string) => (h.length === 5 ? h : h + ':00')
    const horarios = slotsSelecionados.map((slot) => ({
      diaSemana: slot.diaSemana,
      horarioInicio: norm(slot.horarioInicio),
      ...(slot.horarioFim && { horarioFim: norm(slot.horarioFim) })
    }))
    const payload = {
      horarios,
      capacidade: Number(capacidade) >= 1 ? Number(capacidade) : undefined,
      instrumentoId: Number(instrumentoId),
      professorId: Number(professorId),
      ativo: !!ativo
    }
    const api = getApiClient()
    const req = isEdit ? api.put(`/turmas/${turma!.id}`, payload) : api.post('/turmas', payload)
    req
      .then(() => onSalvo())
      .catch((err) => setErro((err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem || 'Erro ao salvar.'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? t('turmas.editClass') : t('turmas.newClassTitle')}</h2>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {erro && <div className="alert alert-error">{erro}</div>}

          <div className="form-row">
            <div className={`form-group ${showFieldErrors && !grupoId ? 'field-error' : ''}`}>
              <label>Grupo do instrumento *</label>
              <SelectSearch
                value={grupoId}
                onChange={(val) => handleGrupoChange(val)}
                searchUrl="/grupos"
                placeholder="Selecione o grupo"
                emptyOption={{ value: '', label: 'Selecione o grupo' }}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className={`form-group ${showFieldErrors && !instrumentoId ? 'field-error' : ''}`}>
              <label>Instrumento *</label>
              <SelectSearch
                value={String(instrumentoId || '')}
                onChange={(val) => handleInstrumentoChange(val)}
                searchUrl="/instrumentos"
                placeholder={grupoId ? 'Selecione o instrumento' : 'Selecione o grupo antes'}
                disabled={!grupoId}
                extraParams={grupoId ? { grupoId } : {}}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className={`form-group form-group-select-search ${showFieldErrors && !professorId ? 'field-error' : ''}`}>
              <label>Professor *</label>
              {!instrumentoId ? (
                <input type="text" readOnly disabled placeholder="Selecione o instrumento antes" className="select-search-input" />
              ) : professoresFiltrados.length === 0 ? (
                <input type="text" readOnly disabled placeholder="Nenhum professor leciona este instrumento" className="select-search-input" />
              ) : (
                <div className="select-search-wrap">
                  <input
                    type="text"
                    className="select-search-input"
                    placeholder="Digite para buscar o professor..."
                      value={professorDropdownOpen ? professorQuery : (professorSelecionado?.nome ?? '')}
                    onChange={(e) => {
                      setProfessorQuery(e.target.value)
                      setProfessorDropdownOpen(true)
                    }}
                    onFocus={() => setProfessorDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setProfessorDropdownOpen(false), 200)}
                    autoComplete="off"
                    aria-label="Buscar professor"
                  />
                  {professorDropdownOpen && (
                    <ul className="select-search-dropdown" role="listbox">
                      {professoresParaLista.length === 0 ? (
                        <li className="select-search-dropdown-empty">Nenhum professor encontrado</li>
                      ) : (
                        professoresParaLista.map((p) => (
                          <li
                            key={p.id}
                            role="option"
                            className="select-search-dropdown-item"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setProfessorId(String(p.id))
                              setProfessorQuery('')
                              setProfessorDropdownOpen(false)
                            }}
                          >
                            {p.nome}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              )}
              {instrumentoId && professoresFiltrados.length > 0 && (
                <p className="form-hint">Professores que lecionam o instrumento selecionado. Digite para filtrar.</p>
              )}
            </div>
          </div>

          <div className={`form-group ${showFieldErrors && slotsSelecionados.length === 0 ? 'field-error' : ''}`}>
            <label>Dias e horários *</label>
            {!professorId ? (
              <p className="form-hint">Selecione o professor para ver a disponibilidade.</p>
            ) : slotsProfessor.length === 0 ? (
              <p className="form-hint" style={{ color: 'var(--text-muted)' }}>
                {t('turmas.noScheduleProfessor')}
              </p>
            ) : (
              <>
                <p className="form-hint">
                  Selecione os dias e horários em que esta turma ocorrerá (uma única turma).
                </p>
                <div className="turma-slots-grid">
                  {slotsProfessor.map((s) => (
                    <label key={slotKey(s)} className="turma-slot-chip">
                      <input
                        type="checkbox"
                        checked={isSlotSelecionado(s)}
                        onChange={() => toggleSlot(s)}
                      />
                      <span>{formatSlotLabel(s)}</span>
                    </label>
                  ))}
                </div>
                {slotsSelecionados.length > 0 && (
                  <p className="form-hint turma-slots-resumo">
                    1 turma com {slotsSelecionados.length} dia(s)/horário(s)
                  </p>
                )}
              </>
            )}
          </div>

          <div className={`form-group ${showFieldErrors && (!(Number(capacidade) >= 1) || capacidade === '') ? 'field-error' : ''}`}>
            <label>Capacidade *</label>
            <input type="number" min={1} value={capacidade} onChange={(e) => setCapacidade(e.target.value)} required />
            {isEdit && turma?.capacidadePreenchida != null && turma?.capacidade != null && (
              <p className="form-hint">Vagas preenchidas: {turma.capacidadePreenchida}/{turma.capacidade}</p>
            )}
          </div>
          <div className="form-group form-group-status">
            <div className="status-ativo">
              <input
                type="checkbox"
                id="turma-ativo"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="status-checkbox"
              />
              <label htmlFor="turma-ativo" className="status-label">
                Turma ativa (aparece para novas matrículas e nas listas)
              </label>
            </div>
            <p className="form-hint">Desmarque para marcar a turma como inativa.</p>
          </div>
        </form>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onFechar}>{t('common.cancel')}</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
