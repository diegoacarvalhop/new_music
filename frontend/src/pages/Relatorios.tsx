import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import SelectSearch from '../components/SelectSearch'
import { formatarDataLocal, formatarDataHoraLocal } from '../utils/date'
import { FORMAS_DE_PAGAMENTO } from '../utils/formasPagamento'
import { mascaraCPF, mascaraTelefone } from '../utils/validacao'
import type { Page } from '../types'

type ReportRow = Record<string, unknown>

interface ReportParamDef {
  name: string
  label: string
  type: 'select' | 'select-search' | 'number' | 'date' | 'datetime' | 'text'
  optionsUrl?: string
  optionsKey?: string
  optionsSearchUrl?: string
  placeholderFirst?: { value: string; label: string }
  compact?: boolean
}

interface ReportDef {
  id: string
  label: string
  category: string
  endpoint: string
  params?: ReportParamDef[]
  isObject?: boolean
}

const REPORT_DEFS: ReportDef[] = [
  { id: 'grupos', label: 'Grupos', category: 'Cadastrais', endpoint: '/relatorios/cadastrais/grupos' },
  {
    id: 'instrumentos',
    label: 'Instrumentos',
    category: 'Cadastrais',
    endpoint: '/relatorios/cadastrais/instrumentos',
    params: [{ name: 'grupoId', label: 'Grupo', type: 'select-search', optionsSearchUrl: '/grupos', placeholderFirst: { value: '', label: 'Todos' }, compact: true }]
  },
  {
    id: 'alunos',
    label: 'Alunos',
    category: 'Cadastrais',
    endpoint: '/relatorios/cadastrais/alunos',
    params: [
      { name: 'ativo', label: 'Ativo', type: 'select', optionsKey: 'simnao' },
      { name: 'instrumentoId', label: 'Instrumento', type: 'select-search', optionsSearchUrl: '/relatorios/cadastrais/instrumentos-turmas', placeholderFirst: { value: '', label: 'Todos' } }
    ]
  },
  {
    id: 'professores',
    label: 'Professores',
    category: 'Cadastrais',
    endpoint: '/relatorios/cadastrais/professores',
    params: [{ name: 'ativo', label: 'Ativo', type: 'select', optionsKey: 'simnao' }]
  },
  {
    id: 'usuarios',
    label: 'Usuários',
    category: 'Cadastrais',
    endpoint: '/relatorios/cadastrais/usuarios',
    params: [{ name: 'perfil', label: 'Perfil', type: 'select', optionsKey: 'perfil' }]
  },
  {
    id: 'turmas',
    label: 'Turmas',
    category: 'Cadastrais',
    endpoint: '/relatorios/cadastrais/turmas',
    params: [
      { name: 'ativo', label: 'Ativo', type: 'select', optionsKey: 'simnao' },
      { name: 'instrumentoId', label: 'Instrumento', type: 'select-search', optionsSearchUrl: '/instrumentos', placeholderFirst: { value: '', label: 'Todos' } },
      { name: 'professorId', label: 'Professor', type: 'select-search', optionsSearchUrl: '/professores', placeholderFirst: { value: '', label: 'Todos' } }
    ]
  },
  {
    id: 'matriculas',
    label: 'Matrículas',
    category: 'Matrículas',
    endpoint: '/relatorios/matriculas',
    params: [
      { name: 'ativo', label: 'Ativo', type: 'select', optionsKey: 'simnao' },
      { name: 'alunoId', label: 'Aluno', type: 'select-search', optionsSearchUrl: '/alunos', placeholderFirst: { value: '', label: 'Todos' } },
      { name: 'dataInicio', label: 'Data início', type: 'date' },
      { name: 'dataFim', label: 'Data fim', type: 'date' }
    ]
  },
  {
    id: 'mensalidades',
    label: 'Mensalidades',
    category: 'Financeiro',
    endpoint: '/relatorios/mensalidades',
    params: [
      { name: 'ano', label: 'Ano', type: 'number' },
      { name: 'mes', label: 'Mês', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', optionsKey: 'statusMensalidade' },
      { name: 'alunoId', label: 'Aluno', type: 'select-search', optionsSearchUrl: '/alunos', placeholderFirst: { value: '', label: 'Todos' } }
    ]
  },
  {
    id: 'inadimplencia',
    label: 'Inadimplência',
    category: 'Financeiro',
    endpoint: '/relatorios/inadimplencia',
    params: [
      { name: 'ano', label: 'Ano', type: 'number' },
      { name: 'mes', label: 'Mês', type: 'number' }
    ]
  },
  {
    id: 'receita',
    label: 'Receita realizada',
    category: 'Financeiro',
    endpoint: '/relatorios/receita',
    params: [
      { name: 'dataInicio', label: 'Data início', type: 'date' },
      { name: 'dataFim', label: 'Data fim', type: 'date' },
      { name: 'formaPagamento', label: 'Forma de pagamento', type: 'select', optionsKey: 'formasPagamento', placeholderFirst: { value: '', label: 'Todos' } }
    ]
  },
  {
    id: 'presenca-alunos',
    label: 'Presença (alunos)',
    category: 'Presença',
    endpoint: '/relatorios/presenca-alunos',
    params: [
      { name: 'alunoId', label: 'Aluno', type: 'select-search', optionsSearchUrl: '/alunos', placeholderFirst: { value: '', label: 'Todos' } },
      { name: 'dataInicio', label: 'Data início', type: 'date' },
      { name: 'dataFim', label: 'Data fim', type: 'date' }
    ]
  },
  {
    id: 'presenca-professores',
    label: 'Presença (professores)',
    category: 'Presença',
    endpoint: '/relatorios/presenca-professores',
    params: [
      { name: 'professorId', label: 'Professor', type: 'select-search', optionsSearchUrl: '/professores', placeholderFirst: { value: '', label: 'Todos' } },
      { name: 'dataInicio', label: 'Data início', type: 'date' },
      { name: 'dataFim', label: 'Data fim', type: 'date' }
    ]
  },
  { id: 'dashboard', label: 'Consolidado (dashboard)', category: 'Consolidado', endpoint: '/relatorios/consolidado/dashboard', isObject: true },
  {
    id: 'auditoria',
    label: 'Auditoria',
    category: 'Auditoria',
    endpoint: '/relatorios/auditoria',
    params: [
      { name: 'usuarioId', label: 'ID usuário', type: 'number' },
      { name: 'tabela', label: 'Tabela', type: 'text' },
      { name: 'acao', label: 'Ação', type: 'select', optionsKey: 'acaoAuditoria' },
      { name: 'dataInicio', label: 'Data/hora início', type: 'datetime' },
      { name: 'dataFim', label: 'Data/hora fim', type: 'datetime' }
    ]
  },
  {
    id: 'erros',
    label: 'Erros',
    category: 'Erros',
    endpoint: '/relatorios/erros',
    params: [
      { name: 'dataInicio', label: 'Data/hora início', type: 'datetime' },
      { name: 'dataFim', label: 'Data/hora fim', type: 'datetime' }
    ]
  }
]

const OPCOES_SIMNAO = [{ value: '', label: 'Todos' }, { value: 'true', label: 'Sim' }, { value: 'false', label: 'Não' }]
const OPCOES_STATUS = [{ value: '', label: 'Todos' }, { value: 'PENDENTE', label: 'Pendente' }, { value: 'PAGO', label: 'Pago' }, { value: 'ATRASADO', label: 'Atrasado' }]
const OPCOES_ACAO_AUDITORIA = [{ value: '', label: 'Todas' }, { value: 'CONSULTAR', label: 'Consultar' }, { value: 'CRIAR', label: 'Criar' }, { value: 'ATUALIZAR', label: 'Atualizar' }, { value: 'EXCLUIR', label: 'Excluir' }]
const OPCOES_FORMAS_PAGAMENTO = [{ value: '', label: 'Todos' }, ...FORMAS_DE_PAGAMENTO.map((f) => ({ value: f, label: f }))]

const REPORT_OPTIONS = REPORT_DEFS.map((r) => ({ value: r.id, label: r.label }))

export default function Relatorios() {
  const { t, i18n } = useTranslation()
  const [reportId, setReportId] = useState<string>(REPORT_DEFS[0].id)
  const [paramValues, setParamValues] = useState<Record<string, string>>({})
  const [optionsCache, setOptionsCache] = useState<Record<string, { value: string; label: string }[]>>({})
  const [data, setData] = useState<ReportRow[] | Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [modalResponsavel, setModalResponsavel] = useState<ReportRow | null>(null)
  const [stackTraceModal, setStackTraceModal] = useState<string | null>(null)
  const [searchSelectQuery, setSearchSelectQuery] = useState<Record<string, string>>({})
  const [searchSelectOptions, setSearchSelectOptions] = useState<Record<string, { value: string; label: string }[]>>({})
  const [searchSelectOpen, setSearchSelectOpen] = useState<Record<string, boolean>>({})
  const [searchSelectLoading, setSearchSelectLoading] = useState<Record<string, boolean>>({})
  const [searchSelectLabel, setSearchSelectLabel] = useState<Record<string, string>>({})
  const searchSelectDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const report = REPORT_DEFS.find((r) => r.id === reportId) ?? REPORT_DEFS[0]
  const isList = !report.isObject

  const opcoesPerfil = [
    { value: '', label: 'Todos' },
    { value: 'ADMINISTRADOR', label: t('usuarios.profileAdmin').toUpperCase() },
    { value: 'PROFESSOR', label: t('usuarios.profileProfessor').toUpperCase() },
    { value: 'FUNCIONARIO', label: t('usuarios.profileFuncionario').toUpperCase() }
  ]

  const loadOptions = useCallback(async (param: ReportParamDef) => {
    if (param.optionsKey === 'simnao') return OPCOES_SIMNAO
    if (param.optionsKey === 'perfil') return opcoesPerfil
    if (param.optionsKey === 'statusMensalidade') return OPCOES_STATUS
    if (!param.optionsUrl) return []
    const cacheKey = param.optionsUrl
    if (optionsCache[cacheKey]) return optionsCache[cacheKey]
    const api = getApiClient()
    const res = await api.get(cacheKey)
    const raw = param.optionsKey === 'content' ? (res.data as Page<Record<string, unknown>>).content : (res.data as unknown[])
    const list = Array.isArray(raw) ? raw : []
    const opts = list.map((item: unknown) => {
      const o = item as Record<string, unknown>
      const id = o.id as number
      const nome = o.nome ?? (o.instrumentoNome && o.professorNome ? `${o.instrumentoNome} - ${o.professorNome}` : o.instrumentoNome ?? o.professorNome) ?? id
      const label = typeof nome === 'string' ? nome : String(id)
      return { value: String(id), label: label || String(id) }
    })
    const withEmpty = param.optionsKey === 'content' ? [{ value: '', label: 'Todos' }, ...opts] : opts
    setOptionsCache((prev) => ({ ...prev, [cacheKey]: withEmpty }))
    return withEmpty
  }, [optionsCache, t])

  useEffect(() => {
    setData(null)
    setParamValues({})
    setSearchSelectQuery({})
    setSearchSelectOptions({})
    setSearchSelectOpen({})
    setSearchSelectLabel({})
  }, [reportId])

  const fetchSearchOptions = useCallback(async (param: ReportParamDef, busca: string) => {
    if (!param.optionsSearchUrl) return
    const key = param.name
    setSearchSelectLoading((prev) => ({ ...prev, [key]: true }))
    try {
      const api = getApiClient()
      const res = await api.get(param.optionsSearchUrl, { params: { busca: busca || undefined, size: 20, page: 0 } })
      const data = res.data
      const raw = Array.isArray(data) ? data : (data as Page<Record<string, unknown>>).content ?? []
      let opts = (Array.isArray(raw) ? raw : []).map((item: unknown) => {
        const o = item as Record<string, unknown>
        const id = o.id as number
        const nome = (o.nome as string) ?? (o.instrumentoNome && o.professorNome ? `${o.instrumentoNome} - ${o.professorNome}` : null) ?? String(id)
        return { value: String(id), label: String(nome) }
      })
      if (busca && busca.trim()) {
        const term = busca.trim().toLowerCase()
        opts = opts.filter((opt) => opt.label.toLowerCase().includes(term))
      }
      setSearchSelectOptions((prev) => ({ ...prev, [key]: opts }))
    } catch {
      setSearchSelectOptions((prev) => ({ ...prev, [key]: [] }))
    } finally {
      setSearchSelectLoading((prev) => ({ ...prev, [key]: false }))
    }
  }, [])

  const handleSearchSelectSelect = useCallback((param: ReportParamDef, value: string, label: string) => {
    const key = param.name
    setParamValues((prev) => ({ ...prev, [key]: value }))
    setSearchSelectLabel((prev) => ({ ...prev, [key]: value ? label : '' }))
    setSearchSelectOpen((prev) => ({ ...prev, [key]: false }))
  }, [])

  const getOptionsForParam = (param: ReportParamDef): { value: string; label: string }[] => {
    if (param.optionsKey === 'simnao') return OPCOES_SIMNAO
    if (param.optionsKey === 'perfil') return opcoesPerfil
    if (param.optionsKey === 'statusMensalidade') return OPCOES_STATUS
    if (param.optionsKey === 'acaoAuditoria') return OPCOES_ACAO_AUDITORIA
    if (param.optionsKey === 'formasPagamento') return OPCOES_FORMAS_PAGAMENTO
    const key = param.optionsUrl ?? param.optionsKey ?? ''
    const opts = optionsCache[key] ?? []
    if (param.placeholderFirst) return [param.placeholderFirst, ...opts]
    return opts
  }

  useEffect(() => {
    report.params?.forEach((p) => {
      if (p.optionsUrl && p.type !== 'select-search') {
        loadOptions(p).catch(() => {})
      }
    })
  }, [reportId])

  function buildParams(): Record<string, string> {
    const out: Record<string, string> = {}
    report.params?.forEach((p) => {
      let v = paramValues[p.name]?.trim()
      if (v === undefined || v === '') return
      if (p.type === 'datetime' && v) {
        v = v.replace('T', 'T').replace('Z', '')
        if (!v.includes('.')) v = v + ':00'
      }
      out[p.name] = v
    })
    return out
  }

  async function gerar() {
    setErro('')
    setLoading(true)
    try {
      const params = buildParams()
      const qs = new URLSearchParams(params).toString()
      const url = qs ? `${report.endpoint}?${qs}` : report.endpoint
      const res = await getApiClient().get(url)
      if (report.isObject) {
        setData(res.data as Record<string, unknown>)
      } else {
        setData(Array.isArray(res.data) ? res.data : [])
      }
    } catch (e: unknown) {
      setData(null)
      const res = e && typeof e === 'object' && 'response' in e ? (e as { response?: { status?: number; data?: { mensagem?: string } } }).response : undefined
      const status = res?.status
      const msg = res?.data?.mensagem
      setErro(
        status === 403
          ? t('relatorios.erroSemPermissao')
          : msg && msg.trim()
            ? msg
            : 'Erro ao gerar relatório.'
      )
    } finally {
      setLoading(false)
    }
  }

  function exportarCsv() {
    if (!data) return
    if (report.isObject) {
      const obj = data as Record<string, unknown>
      const lines = Object.entries(obj).map(([k, v]) => `${k};${v}`)
      const csv = 'Campo;Valor\n' + lines.join('\n')
      downloadCsv(csv, `relatorio-${report.id}.csv`)
      return
    }
    const rows = data as ReportRow[]
    if (rows.length === 0) return
    const cols = reportId === 'presenca-alunos'
      ? PRESENCA_ALUNOS_ORDER.filter((c) => Object.prototype.hasOwnProperty.call(rows[0], c))
      : reportId === 'presenca-professores'
        ? PRESENCA_PROFESSORES_ORDER.filter((c) => Object.prototype.hasOwnProperty.call(rows[0], c))
        : reportId === 'receita'
          ? RECEITA_ORDER.filter((c) => Object.prototype.hasOwnProperty.call(rows[0], c))
          : reportId === 'erros'
            ? ERROS_ORDER.filter((c) => Object.prototype.hasOwnProperty.call(rows[0], c))
            : Object.keys(rows[0])
    const header = cols.map((c) => escapeCsv(getColumnLabel(c))).join(';')
    const body = rows.map((r) =>
      cols.map((c) => escapeCsv(reportId === 'erros' && c === 'stackTrace' ? String(r[c] ?? '') : formatCellValue(r[c], c))).join(';')
    ).join('\n')
    const csv = header + '\n' + body
    downloadCsv(csv, `relatorio-${report.id}.csv`)
  }

  function escapeCsv(s: string): string {
    if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  function downloadCsv(content: string, filename: string) {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const categories = Array.from(new Set(REPORT_DEFS.map((r) => r.category)))

  function getColumnLabel(col: string): string {
    const key = `relatorios.column.${col}`
    const label = t(key)
    if (label !== key) return label
    // Fallback: camelCase → palavras com primeira letra maiúscula
    return col.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim()
  }

  const colunasData = ['dataNascimento', 'dataInicio', 'dataFim', 'vencimento', 'dataPagamento', 'dataAula']
  const colunasDataHora = ['dataHora']
  const colunasCpf = ['cpf', 'responsavelCpf']

  function formatCellValue(val: unknown, col: string): string {
    if (val === null || val === undefined) return ''
    if (typeof val === 'boolean') return val ? t('common.yes') : t('common.no')
    if (col === 'valor' || col === 'valorTotal' || col === 'valorCurso') {
      const num = typeof val === 'number' ? val : typeof val === 'string' && val.trim() ? Number(val) : NaN
      if (!Number.isNaN(num)) {
        return new Intl.NumberFormat(i18n.language || 'pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
      }
    }
    if (col === 'telefone' && typeof val === 'string' && val.trim()) return mascaraTelefone(val)
    if (colunasData.includes(col) && typeof val === 'string' && val.trim()) return formatarDataLocal(val)
    if (colunasDataHora.includes(col) && typeof val === 'string' && val.trim()) return formatarDataHoraLocal(val)
    if (colunasCpf.includes(col) && typeof val === 'string' && val.trim()) return mascaraCPF(val)
    return String(val)
  }

  const isReportAlunos = reportId === 'alunos'
  const PRESENCA_ALUNOS_ORDER: string[] = ['dataAula', 'presente', 'alunoNome', 'turma', 'conteudoAula']
  const PRESENCA_PROFESSORES_ORDER: string[] = ['dataAula', 'presente', 'professorNome', 'instrumento']
  const RECEITA_ORDER: string[] = ['dataPagamento', 'alunoNome', 'valor', 'formaPagamento', 'mesAno']
  const ERROS_ORDER: string[] = ['id', 'dataHora', 'acao', 'mensagemErro', 'tipoExcecao', 'stackTrace']
  const displayCols = (rows: ReportRow[]): string[] => {
    if (rows.length === 0) return []
    const keys = Object.keys(rows[0])
    if (reportId === 'presenca-alunos') {
      return PRESENCA_ALUNOS_ORDER.filter((c) => keys.includes(c))
    }
    if (reportId === 'presenca-professores') {
      return PRESENCA_PROFESSORES_ORDER.filter((c) => keys.includes(c))
    }
    if (reportId === 'receita') {
      return RECEITA_ORDER.filter((c) => keys.includes(c))
    }
    if (reportId === 'erros') {
      return ERROS_ORDER.filter((c) => keys.includes(c))
    }
    if (isReportAlunos) return keys.filter((c) => c !== 'responsavelNome' && c !== 'responsavelCpf')
    return keys
  }

  const STACK_TRACE_PREVIEW_LEN = 100
  function truncateStackTrace(s: string | null | undefined): string {
    if (s == null || s === '') return ''
    return s.length <= STACK_TRACE_PREVIEW_LEN ? s : s.slice(0, STACK_TRACE_PREVIEW_LEN) + '...'
  }

  return (
    <>
      <div className="page-header">
        <h1>{t('relatorios.title')}</h1>
      </div>
      {erro && <div className="alert alert-error">{erro}</div>}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Selecione o relatório</h2>
        <div className="relatorios-filters">
          <div className="form-group relatorios-form-group-report">
            <label htmlFor="rel-report">Relatório</label>
            <SelectSearch
              id="rel-report"
              value={reportId}
              onChange={(val) => setReportId(val)}
              options={REPORT_OPTIONS}
              placeholder="Digite para buscar o relatório..."
              aria-label="Selecione o relatório"
            />
          </div>
          {report.params?.map((p) => (
            <div key={p.name} className="form-group">
              <label htmlFor={`rel-${p.name}`}>{p.label}</label>
              {p.type === 'select-search' && p.optionsSearchUrl ? (
                <div className={`relatorio-select-search${p.compact ? ' relatorio-select-search--compact' : ''}${p.name === 'alunoId' ? ' relatorio-select-search--aluno' : ''}`}>
                  <input
                    id={`rel-${p.name}`}
                    type="text"
                    autoComplete="off"
                    value={paramValues[p.name] ? (searchSelectLabel[p.name] ?? '') : (searchSelectQuery[p.name] ?? '')}
                    onChange={(e) => {
                      const v = e.target.value
                      if (paramValues[p.name]) {
                        setParamValues((prev) => ({ ...prev, [p.name]: '' }))
                        setSearchSelectLabel((prev) => ({ ...prev, [p.name]: '' }))
                      }
                      setSearchSelectQuery((prev) => ({ ...prev, [p.name]: v }))
                      if (searchSelectDebounceRef.current) clearTimeout(searchSelectDebounceRef.current)
                      searchSelectDebounceRef.current = setTimeout(() => {
                        setSearchSelectOpen((prev) => ({ ...prev, [p.name]: true }))
                        fetchSearchOptions(p, v).then(() => {})
                      }, 350)
                    }}
                    onFocus={() => {
                      setSearchSelectOpen((prev) => ({ ...prev, [p.name]: true }))
                      if (!searchSelectOptions[p.name]?.length && !searchSelectQuery[p.name]) fetchSearchOptions(p, '').then(() => {})
                    }}
                    onBlur={() => setTimeout(() => setSearchSelectOpen((prev) => ({ ...prev, [p.name]: false })), 200)}
                    placeholder={p.placeholderFirst?.label ?? p.label}
                  />
                  {searchSelectOpen[p.name] && (
                    <ul className="relatorio-select-search-dropdown" role="listbox">
                      {p.placeholderFirst && (
                        <li
                          role="option"
                          onMouseDown={(e) => { e.preventDefault(); handleSearchSelectSelect(p, p.placeholderFirst!.value, p.placeholderFirst!.label); }}
                        >
                          {p.placeholderFirst.label}
                        </li>
                      )}
                      {searchSelectLoading[p.name] ? (
                        <li className="relatorio-select-search-loading">Carregando...</li>
                      ) : (
                        (searchSelectOptions[p.name] ?? []).map((opt) => (
                          <li
                            key={opt.value}
                            role="option"
                            onMouseDown={(e) => { e.preventDefault(); handleSearchSelectSelect(p, opt.value, opt.label); }}
                          >
                            {opt.label}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              ) : p.type === 'select' ? (
                <SelectSearch
                  id={`rel-${p.name}`}
                  value={paramValues[p.name] ?? ''}
                  onChange={(val) => setParamValues((prev) => ({ ...prev, [p.name]: val }))}
                  options={getOptionsForParam(p)}
                  placeholder={p.placeholderFirst?.label ?? `Buscar ${p.label.toLowerCase()}...`}
                  aria-label={p.label}
                />
              ) : p.type === 'date' ? (
                <input
                  id={`rel-${p.name}`}
                  type="date"
                  value={paramValues[p.name] ?? ''}
                  onChange={(e) => setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                />
              ) : p.type === 'number' ? (
                <input
                  id={`rel-${p.name}`}
                  type="number"
                  value={paramValues[p.name] ?? ''}
                  onChange={(e) => setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                  placeholder={p.name === 'mes' ? '1-12' : p.name === 'ano' ? 'ex: 2025' : ''}
                />
              ) : p.type === 'datetime' ? (
                <input
                  id={`rel-${p.name}`}
                  type="datetime-local"
                  value={paramValues[p.name] ?? ''}
                  onChange={(e) => setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                />
              ) : (
                <input
                  id={`rel-${p.name}`}
                  type="text"
                  value={paramValues[p.name] ?? ''}
                  onChange={(e) => setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                  placeholder={p.label}
                />
              )}
            </div>
          ))}
          <div className="form-group" style={{ alignSelf: 'flex-end' }}>
            <button type="button" className="btn btn-primary" onClick={gerar} disabled={loading}>
              {loading ? 'Gerando...' : 'Gerar'}
            </button>
          </div>
        </div>
      </div>

      {data !== null && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{report.label}</h2>
            {isList ? (
              <button type="button" className="btn btn-outline" onClick={exportarCsv}>
                Exportar CSV
              </button>
            ) : (
              <button type="button" className="btn btn-outline" onClick={exportarCsv}>
                Exportar CSV
              </button>
            )}
          </div>
          {report.isObject ? (
            <dl
              className="relatorio-object relatorio-object--query"
              style={{ ['--cols' as string]: Object.keys(data as Record<string, unknown>).length }}
            >
              {Object.entries(data as Record<string, unknown>).map(([k]) => (
                <span key={`label-${k}`} className="relatorio-object-label">
                  {getColumnLabel(k)}
                </span>
              ))}
              {Object.entries(data as Record<string, unknown>).map(([k, v]) => (
                <span key={`value-${k}`} className="relatorio-object-value">
                  {String(v)}
                </span>
              ))}
            </dl>
          ) : (
            <>
              {(data as ReportRow[]).length === 0 ? (
                <p className="empty-state">{t('relatorios.noRecordFound')}</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {displayCols(data as ReportRow[]).map((col) => (
                          <th key={col}>{getColumnLabel(col)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(data as ReportRow[]).map((row, idx) => (
                        <tr key={idx}>
                          {displayCols(data as ReportRow[]).map((col) => {
                            const val = row[col]
                            const temResponsavel = isReportAlunos && (row.responsavelNome || row.responsavelCpf)
                            if (isReportAlunos && col === 'cpf' && temResponsavel) {
                              return (
                                <td
                                  key={col}
                                  className="celula-valor-clicavel"
                                  onClick={() => setModalResponsavel(row)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setModalResponsavel(row))}
                                >
                                  <span className="celula-valor-ver-calculo">{t('relatorios.clickToSeeResponsavel')}</span>
                                </td>
                              )
                            }
                            if (reportId === 'erros' && col === 'stackTrace') {
                              const full = typeof val === 'string' ? val : String(val ?? '')
                              if (!full.trim()) return <td key={col}>—</td>
                              const preview = truncateStackTrace(full)
                              return (
                                <td key={col}>
                                  <button
                                    type="button"
                                    className="link-stack-trace"
                                    onClick={() => setStackTraceModal(full)}
                                  >
                                    {preview}
                                  </button>
                                </td>
                              )
                            }
                            return <td key={col}>{formatCellValue(val, col)}</td>
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {modalResponsavel != null && (
        <div className="modal-overlay" onClick={() => setModalResponsavel(null)}>
          <div className="modal modal-responsavel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('relatorios.infoResponsavel')}</h2>
            </div>
            <div className="modal-body">
              <dl className="relatorio-object">
                <div>
                  <dt>{getColumnLabel('responsavelNome')}</dt>
                  <dd>{formatCellValue(modalResponsavel.responsavelNome, 'responsavelNome') || '—'}</dd>
                </div>
                <div>
                  <dt>{getColumnLabel('responsavelCpf')}</dt>
                  <dd>{formatCellValue(modalResponsavel.responsavelCpf, 'responsavelCpf') || '—'}</dd>
                </div>
              </dl>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setModalResponsavel(null)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {stackTraceModal != null && (
        <div className="modal-overlay" onClick={() => setStackTraceModal(null)}>
          <div className="modal modal-stack-trace" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('relatorios.column.stackTrace')}</h2>
            </div>
            <div className="modal-body">
              <pre className="stack-trace-content">{stackTraceModal}</pre>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setStackTraceModal(null)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
