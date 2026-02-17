import { useState, useEffect, useMemo, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import { calcularDataFimCurso, formatarDataLocal } from '../utils/date'
import { mascaraMonetaria, valorMonetarioParaNumero } from '../utils/validacao'
import type { Matricula, Aluno, Turma } from '../types'

interface ModalMatriculaProps {
  matricula: Matricula | null
  onFechar: () => void
  onSalvo: () => void
}

export default function ModalMatricula({ matricula, onFechar, onSalvo }: ModalMatriculaProps) {
  const { t } = useTranslation()
  const [dataInicio, setDataInicio] = useState('')
  const [valorCurso, setValorCurso] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [aulasPorSemana, setAulasPorSemana] = useState<1 | 2>(1)
  const [ativo, setAtivo] = useState(true)
  const [alunoId, setAlunoId] = useState<string | number>('')
  const [turmaId, setTurmaId] = useState<string | number>('')
  const [alunoQuery, setAlunoQuery] = useState('')
  const [alunoDropdownOpen, setAlunoDropdownOpen] = useState(false)
  const [turmaQuery, setTurmaQuery] = useState('')
  const [turmaDropdownOpen, setTurmaDropdownOpen] = useState(false)
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [showFieldErrors, setShowFieldErrors] = useState(false)

  const isEdit = !!matricula?.id
  const alunosAtivos = alunos.filter((a) => a.ativo !== false)
  const opcoesAluno =
    isEdit && matricula?.alunoId && !alunosAtivos.some((a) => a.id === matricula.alunoId)
      ? [...alunos.filter((a) => a.id === matricula!.alunoId), ...alunosAtivos]
      : alunosAtivos

  const alunosParaLista = useMemo(() => {
    const q = alunoQuery.trim().toLowerCase()
    if (!q) return opcoesAluno
    return opcoesAluno.filter((a) => (a.nome ?? '').toLowerCase().includes(q))
  }, [opcoesAluno, alunoQuery])

  const turmasParaLista = useMemo(() => {
    const q = turmaQuery.trim().toLowerCase()
    if (!q) return turmas
    return turmas.filter((t) => {
      const texto = `${t.instrumentoNome ?? ''} ${t.professorNome ?? ''}`.toLowerCase()
      return texto.includes(q)
    })
  }, [turmas, turmaQuery])

  function labelTurma(t: Turma): string {
    const cap = t.capacidade != null && t.capacidadePreenchida != null ? ` ${t.capacidadePreenchida}/${t.capacidade}` : ''
    const turmaAtual = matricula?.turmaId ?? null
    const cheia = t.capacidade != null && (t.capacidadePreenchida ?? 0) >= t.capacidade && turmaAtual != null && turmaAtual !== t.id
    return `${t.instrumentoNome} — ${t.professorNome}${cap}${cheia ? ' (lotada)' : ''}`
  }

  useEffect(() => {
    getApiClient().get<{ content?: Aluno[] }>('/alunos').then((r) => {
      const lista = Array.isArray(r.data?.content) ? r.data!.content! : []
      setAlunos(lista)
    })
    getApiClient().get<{ content?: Turma[] }>('/turmas').then((r) => setTurmas(Array.isArray(r.data?.content) ? r.data!.content! : []))
  }, [])

  const turmaSelecionada = turmas.find((t) => t.id === Number(turmaId))
  const isCanto = (turmaSelecionada?.instrumentoGrupoNome ?? '').toLowerCase() === 'canto'
  const dataFimCalculada = calcularDataFimCurso(dataInicio, aulasPorSemana, isCanto)

  const diasDaTurma = useMemo(() => {
    const horarios = turmaSelecionada?.horarios ?? []
    if (horarios.length === 0) return null
    const set = new Set(horarios.map((h) => h.diaSemana).filter((d): d is number => d != null))
    return set.size > 0 ? set : null
  }, [turmaSelecionada])

  const MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const DIAS_SEMANA_HEADER = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const [calendarioMes, setCalendarioMes] = useState({ ano: new Date().getFullYear(), mes: new Date().getMonth() })
  const [calendarioAberto, setCalendarioAberto] = useState(false)

  useEffect(() => {
    if (dataInicio && /^\d{4}-\d{2}-\d{2}$/.test(dataInicio.slice(0, 10))) {
      const [y, m] = dataInicio.slice(0, 10).split('-').map(Number)
      setCalendarioMes((prev) => (prev.ano === y && prev.mes === m - 1 ? prev : { ano: y, mes: m - 1 }))
    }
  }, [dataInicio])

  const diasAtivosParaCalendario = useMemo(() => {
    if (diasDaTurma && diasDaTurma.size > 0) return diasDaTurma
    const segASex = new Set<number>([1, 2, 3, 4, 5])
    return segASex
  }, [diasDaTurma])

  const gradeDoMes = useMemo(() => {
    const { ano, mes } = calendarioMes
    const primeiro = new Date(ano, mes, 1)
    const ultimo = new Date(ano, mes + 1, 0)
    const diaInicioSemana = primeiro.getDay()
    const totalDias = ultimo.getDate()
    const linhas: (number | null)[][] = []
    let linha: (number | null)[] = []
    for (let i = 0; i < diaInicioSemana; i++) linha.push(null)
    for (let d = 1; d <= totalDias; d++) {
      linha.push(d)
      if (linha.length === 7) {
        linhas.push(linha)
        linha = []
      }
    }
    if (linha.length) {
      while (linha.length < 7) linha.push(null)
      linhas.push(linha)
    }
    return linhas
  }, [calendarioMes])

  function diaEhAtivo(dia: number): boolean {
    const { ano, mes } = calendarioMes
    const d = new Date(ano, mes, dia)
    return diasAtivosParaCalendario.has(d.getDay())
  }

  function aoClicarDia(dia: number) {
    if (!diaEhAtivo(dia)) return
    const { ano, mes } = calendarioMes
    const y = ano
    const m = String(mes + 1).padStart(2, '0')
    const day = String(dia).padStart(2, '0')
    setDataInicio(`${y}-${m}-${day}`)
    setCalendarioAberto(false)
  }

  function dataInicioParaValorDoDia(dia: number): string {
    const { ano, mes } = calendarioMes
    const m = String(mes + 1).padStart(2, '0')
    const day = String(dia).padStart(2, '0')
    return `${ano}-${m}-${day}`
  }

  const dataInicioEhNoMesAtual = useMemo(() => {
    if (!dataInicio || !/^\d{4}-\d{2}-\d{2}$/.test(dataInicio.slice(0, 10))) return false
    const [y, m] = dataInicio.slice(0, 10).split('-').map(Number)
    return y === calendarioMes.ano && m === calendarioMes.mes + 1
  }, [dataInicio, calendarioMes])

  useEffect(() => {
    if (diasDaTurma && diasDaTurma.size > 0 && dataInicio && /^\d{4}-\d{2}-\d{2}$/.test(dataInicio.slice(0, 10))) {
      const [y, m, d] = dataInicio.slice(0, 10).split('-').map(Number)
      const date = new Date(y, m - 1, d)
      if (!diasDaTurma.has(date.getDay())) {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        let next = new Date(hoje)
        while (!diasDaTurma.has(next.getDay())) next.setDate(next.getDate() + 1)
        const ny = next.getFullYear()
        const nm = String(next.getMonth() + 1).padStart(2, '0')
        const nd = String(next.getDate()).padStart(2, '0')
        setDataInicio(`${ny}-${nm}-${nd}`)
      }
    }
  }, [diasDaTurma, dataInicio])

  useEffect(() => {
    if (matricula) {
      setDataInicio(matricula.dataInicio ? matricula.dataInicio.slice(0, 10) : '')
      setValorCurso(matricula.valorCurso != null ? mascaraMonetaria(String(Math.round(Number(matricula.valorCurso) * 100))) : '')
      setDataVencimento(matricula.dataVencimento ? matricula.dataVencimento.slice(0, 10) : '')
      setAulasPorSemana((matricula.aulasPorSemana === 2 ? 2 : 1) as 1 | 2)
      setAtivo(matricula.ativo !== false)
      setAlunoId(matricula.alunoId || '')
      setTurmaId(matricula.turmaId || '')
      setAlunoQuery('')
      setTurmaQuery('')
    } else {
      const hoje = new Date().toISOString().slice(0, 10)
      setDataInicio(hoje)
      setValorCurso('')
      setDataVencimento('')
      setAulasPorSemana(1)
      setAtivo(true)
      const ativos = alunos.filter((a) => a.ativo !== false)
      if (ativos.length) setAlunoId(ativos[0].id)
      setAlunoQuery('')
      setTurmaQuery('')
    }
  }, [matricula, alunos.length, turmas.length])

  useEffect(() => {
    if (!isEdit && turmaId && turmas.length > 0) {
      const t = turmas.find((x) => x.id === Number(turmaId))
      if (t) {
        const aps = (t.aulasPorSemana ?? t.horarios?.length ?? 1) === 2 ? 2 : 1
        setAulasPorSemana(aps as 1 | 2)
      }
    }
  }, [isEdit, turmaId, turmas])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setShowFieldErrors(false)
    const alunoVazio = !alunoId
    const turmaVazia = !turmaId
    const dataInicioVazia = !dataInicio.trim()
    const temErro = alunoVazio || turmaVazia || dataInicioVazia
    if (temErro) {
      setErro('Preencha os campos obrigatórios.')
      setShowFieldErrors(true)
      return
    }
    setLoading(true)
    const api = getApiClient()
    const payload = {
      dataInicio,
      ativo,
      valorCurso: valorMonetarioParaNumero(valorCurso),
      dataVencimento: dataVencimento || undefined,
      aulasPorSemana,
      alunoId: Number(alunoId),
      turmaId: Number(turmaId)
    }
    const req = isEdit ? api.put(`/matriculas/${matricula!.id}`, payload) : api.post('/matriculas', payload)
    req
      .then(() => onSalvo())
      .catch((err) => setErro((err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem || 'Erro ao salvar.'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? t('matriculas.editEnrollment') : t('matriculas.newEnrollment')}</h2>
        </div>
        <form onSubmit={handleSubmit} className="modal-body modal-matricula-form">
          {erro && <div className="alert alert-error">{erro}</div>}
          <div className="form-row form-row-matricula">
            <div className={`form-group form-group-full ${showFieldErrors && !alunoId ? 'field-error' : ''}`}>
              <label>Aluno *</label>
              {alunosAtivos.length === 0 && alunos.length > 0 ? (
                <input type="text" className="select-search-input" readOnly disabled placeholder="Nenhum aluno ativo" />
              ) : (
                <div className="select-search-wrap">
                  <input
                    type="text"
                    className="select-search-input"
                    placeholder="Digite para buscar o aluno..."
                    value={alunoDropdownOpen ? alunoQuery : (opcoesAluno.find((a) => a.id === Number(alunoId))?.nome ?? '')}
                    onChange={(e) => { setAlunoQuery(e.target.value); setAlunoDropdownOpen(true) }}
                    onFocus={() => setAlunoDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setAlunoDropdownOpen(false), 200)}
                    autoComplete="off"
                    aria-label="Buscar aluno"
                  />
                  {alunoDropdownOpen && (
                    <ul className="select-search-dropdown" role="listbox">
                      {alunosParaLista.length === 0 ? (
                        <li className="select-search-dropdown-empty">Nenhum aluno encontrado</li>
                      ) : (
                        alunosParaLista.map((a) => (
                          <li key={a.id} role="option" className="select-search-dropdown-item" onMouseDown={(e) => { e.preventDefault(); setAlunoId(String(a.id)); setAlunoQuery(''); setAlunoDropdownOpen(false) }}>
                            {a.nome}{a.ativo === false ? ' (inativo)' : ''}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              )}
              {alunos.length > 0 && alunosAtivos.length === 0 && (
                <p className="form-hint">Nenhum aluno ativo. Ative o cadastro do aluno para matricular.</p>
              )}
            </div>
          </div>
          <div className="form-row form-row-matricula">
            <div className={`form-group form-group-full ${showFieldErrors && !turmaId ? 'field-error' : ''}`}>
              <label>Turma *</label>
              {turmas.length === 0 ? (
                <input type="text" className="select-search-input" readOnly disabled placeholder="Nenhuma turma cadastrada" />
              ) : (
                <div className="select-search-wrap">
                  <input
                    type="text"
                    className="select-search-input"
                    placeholder="Digite para buscar a turma (instrumento ou professor)..."
                    value={turmaDropdownOpen ? turmaQuery : (() => { const t = turmas.find((x) => x.id === Number(turmaId)); return t ? labelTurma(t) : '' })()}
                    onChange={(e) => { setTurmaQuery(e.target.value); setTurmaDropdownOpen(true) }}
                    onFocus={() => setTurmaDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setTurmaDropdownOpen(false), 200)}
                    autoComplete="off"
                    aria-label="Buscar turma"
                  />
                  {turmaDropdownOpen && (
                    <ul className="select-search-dropdown" role="listbox">
                      {turmasParaLista.length === 0 ? (
                        <li className="select-search-dropdown-empty">Nenhuma turma encontrada</li>
                      ) : (
                        turmasParaLista.map((t) => {
                          const cheia = t.capacidade != null && (t.capacidadePreenchida ?? 0) >= t.capacidade && matricula?.turmaId !== t.id
                          return (
                            <li key={t.id} role="option" className="select-search-dropdown-item" onMouseDown={(e) => { e.preventDefault(); if (!cheia) { setTurmaId(String(t.id)); setTurmaQuery(''); setTurmaDropdownOpen(false) } }} style={cheia ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}>
                              {labelTurma(t)}
                            </li>
                          )
                        })
                      )}
                    </ul>
                  )}
                </div>
              )}
              <p className="form-hint">Selecione a turma primeiro; as aulas por semana serão definidas pela turma.</p>
            </div>
          </div>
          <div className="form-row form-row-matricula">
            <div className="form-group form-group-radios">
              <label>Aulas por semana *</label>
              <div className="radio-group-inline">
                <label className="radio-option">
                  <input type="radio" name="aulasPorSemana" checked={aulasPorSemana === 1} onChange={() => setAulasPorSemana(1)} />
                  <span>1 aula por semana</span>
                </label>
                <label className="radio-option">
                  <input type="radio" name="aulasPorSemana" checked={aulasPorSemana === 2} onChange={() => setAulasPorSemana(2)} />
                  <span>2 aulas por semana</span>
                </label>
              </div>
            </div>
          </div>
          <div className="form-row form-row-matricula">
            <div className="form-group">
              <label>Valor do curso (R$)</label>
              <input type="text" inputMode="numeric" value={valorCurso} onChange={(e) => setValorCurso(mascaraMonetaria(e.target.value))} placeholder="Ex: 150,00" />
            </div>
            <div className="form-group">
              <label>Dia de vencimento</label>
              <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} placeholder="DD/MM/AAAA" title="Dia de vencimento mensal (o dia será usado para todos os meses)" />
            </div>
          </div>
          <div className="form-row form-row-matricula">
            <div className={`form-group ${showFieldErrors && !dataInicio.trim() ? 'field-error' : ''}`}>
              <label>Data início *</label>
              <div className="date-picker-wrap date-picker-single-field">
                <input type="hidden" value={dataInicio} readOnly aria-hidden />
                <button
                  type="button"
                  className={`date-picker-trigger ${!dataInicio ? 'date-picker-trigger-placeholder' : ''}`}
                  onClick={() => setCalendarioAberto((v) => !v)}
                  aria-expanded={calendarioAberto}
                  aria-haspopup="dialog"
                  aria-label="Escolher data de início"
                >
                  {dataInicio ? formatarDataLocal(dataInicio) : 'Selecione a data'}
                  <span className="date-picker-trigger-icon" aria-hidden>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </span>
                </button>
                {calendarioAberto && (
                  <div className="date-picker-dropdown" onMouseDown={(e) => e.preventDefault()}>
                    <div className="date-picker-calendario">
                      <div className="date-picker-calendario-header">
                        <button type="button" className="date-picker-nav" onClick={() => setCalendarioMes((p) => (p.mes === 0 ? { ano: p.ano - 1, mes: 11 } : { ano: p.ano, mes: p.mes - 1 }))} aria-label="Mês anterior">‹</button>
                        <span className="date-picker-mes-ano">{MESES_NOME[calendarioMes.mes]} {calendarioMes.ano}</span>
                        <button type="button" className="date-picker-nav" onClick={() => setCalendarioMes((p) => (p.mes === 11 ? { ano: p.ano + 1, mes: 0 } : { ano: p.ano, mes: p.mes + 1 }))} aria-label="Próximo mês">›</button>
                      </div>
                      <div className="date-picker-weekdays">
                        {DIAS_SEMANA_HEADER.map((nome) => (
                          <span key={nome} className="date-picker-weekday">{nome}</span>
                        ))}
                      </div>
                      <div className="date-picker-grid">
                        {gradeDoMes.map((linha, li) =>
                          linha.map((dia, di) => (
                            <div key={`${li}-${di}`} className="date-picker-cell-wrap">
                              {dia === null ? (
                                <span className="date-picker-cell date-picker-cell-empty" />
                              ) : (
                                <button
                                  type="button"
                                  className={`date-picker-cell date-picker-cell-day ${diaEhAtivo(dia) ? 'date-picker-cell-ativo' : 'date-picker-cell-inativo'} ${dataInicioEhNoMesAtual && dataInicio === dataInicioParaValorDoDia(dia) ? 'date-picker-cell-selecionado' : ''}`}
                                  onClick={() => aoClicarDia(dia)}
                                  disabled={!diaEhAtivo(dia)}
                                  title={diaEhAtivo(dia) ? `Selecionar ${dia}/${calendarioMes.mes + 1}/${calendarioMes.ano}` : 'Dia não disponível para esta turma'}
                                >
                                  {dia}
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {calendarioAberto && (
                <div className="date-picker-backdrop" role="presentation" onMouseDown={() => setCalendarioAberto(false)} aria-hidden />
              )}
              {diasDaTurma != null && diasDaTurma.size > 0 && (
                <p className="form-hint">Clique no campo para abrir o calendário. Dias em que a turma tem aula estão ativos.</p>
              )}
            </div>
            <div className="form-group">
              <label>Data fim do curso</label>
              <div
                className="form-readonly"
                title={
                  isCanto
                    ? 'Canto: 2 aulas/semana = 3 meses, 1 aula/semana = 6 meses'
                    : 'Calculada: 2 aulas/semana = 1 ano, 1 aula/semana = 2 anos'
                }
              >
                {dataFimCalculada ? formatarDataLocal(dataFimCalculada) : '—'}
              </div>
            </div>
          </div>
          <div className="form-group form-group-status">
            <div className="status-ativo">
              <input
                type="checkbox"
                id="matricula-ativo"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="status-checkbox"
              />
              <label htmlFor="matricula-ativo" className="status-label">
                {t('matriculas.enrollmentActiveHint')}
              </label>
            </div>
            <p className="form-hint">Desmarque para marcar a matrícula como inativa.</p>
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
