import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import Paginacao from './Paginacao'
import SelectSearch from './SelectSearch'
import { formatarDataLocal } from '../utils/date'

export interface PresencaItem {
  id?: number
  dataAula?: string
  presente?: boolean
  conteudoAula?: string
}

interface ModalPresencasAlunoProps {
  turmaId: number
  matriculaId: number
  alunoNome: string
  ano: number
  mes: number
  onFechar: () => void
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export default function ModalPresencasAluno({ turmaId, matriculaId, alunoNome, ano: anoInicial, mes: mesInicial, onFechar }: ModalPresencasAlunoProps) {
  const { t } = useTranslation()
  const [ano, setAno] = useState(anoInicial)
  const [mes, setMes] = useState(mesInicial)
  const [lista, setLista] = useState<PresencaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [alterandoId, setAlterandoId] = useState<number | string | null>(null)
  const [salvandoConteudoId, setSalvandoConteudoId] = useState<string | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [size, setSize] = useState(10)

  useEffect(() => {
    setAno(anoInicial)
    setMes(mesInicial)
  }, [anoInicial, mesInicial])

  const carregar = useCallback(() => {
    setLoading(true)
    setErro('')
    setLista([])
    getApiClient()
      .get<PresencaItem[]>(`/turmas/${turmaId}/presencas/aluno/${matriculaId}`, { params: { ano, mes } })
      .then((r) => {
        const raw = r.data
        const arr = Array.isArray(raw) ? raw : []
        setLista(arr.map((p) => ({
          ...p,
          dataAula: p.dataAula != null ? String(p.dataAula).slice(0, 10) : undefined
        })))
      })
      .catch(() => setErro('Erro ao carregar presenças.'))
      .finally(() => setLoading(false))
  }, [turmaId, matriculaId, ano, mes])

  useEffect(() => {
    carregar()
  }, [carregar])

  function alterarPresenca(p: PresencaItem) {
    const dataAula = p.dataAula?.slice(0, 10)
    if (!dataAula) return
    const novoPresente = !p.presente
    const chave = String(p.id ?? dataAula)
    setAlterandoId(chave)
    setErro('')
    getApiClient()
      .post(`/turmas/${turmaId}/presencas`, {
        dataAula,
        registros: [{ matriculaId, presente: novoPresente }]
      })
      .then(() => {
        setLista((prev) =>
          prev.map((item) =>
            (item.id === p.id || item.dataAula === p.dataAula)
              ? { ...item, presente: novoPresente }
              : item
          )
        )
      })
      .catch(() => setErro('Erro ao alterar presença.'))
      .finally(() => setAlterandoId(null))
  }

  function atualizarConteudoLocal(p: PresencaItem, valor: string) {
    setLista((prev) =>
      prev.map((item) =>
        (item.id === p.id || item.dataAula === p.dataAula)
          ? { ...item, conteudoAula: valor }
          : item
      )
    )
  }

  function salvarConteudo(p: PresencaItem) {
    const dataAula = p.dataAula?.slice(0, 10)
    if (!dataAula) return
    const chave = String(p.id ?? dataAula)
    setSalvandoConteudoId(chave)
    setErro('')
    getApiClient()
      .post(`/turmas/${turmaId}/presencas`, {
        dataAula,
        registros: [{ matriculaId, presente: p.presente ?? true, conteudoAula: (p.conteudoAula ?? '').trim() || undefined }]
      })
      .then(() => { /* já atualizado no estado local */ })
      .catch(() => setErro('Erro ao atualizar conteúdo da aula.'))
      .finally(() => setSalvandoConteudoId(null))
  }

  const mesNome = MESES[mes - 1] ?? ''
  const totais = lista.reduce((acc, p) => {
    if (p.presente) acc.presenças += 1
    else acc.faltas += 1
    return acc
  }, { presenças: 0, faltas: 0 })

  const totalElements = lista.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const listaPaginada = useMemo(
    () => lista.slice(pageIndex * size, pageIndex * size + size),
    [lista, pageIndex, size]
  )

  useEffect(() => {
    if (pageIndex >= totalPages && totalPages > 0) setPageIndex(0)
  }, [pageIndex, totalPages])

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal modal-presencas-aluno" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Presenças e Faltas</h2>
        </div>
        <div className="modal-body">
          {erro && <div className="alert alert-error">{erro}</div>}
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Mês</label>
              <SelectSearch
                value={String(mes)}
                onChange={(val) => setMes(Number(val) || 1)}
                options={MESES.map((nome, i) => ({ value: String(i + 1), label: nome }))}
                placeholder="Mês"
                aria-label="Mês"
                className="select-search-wrap--compact"
              />
            </div>
            <div className="form-group">
              <label>Ano</label>
              <input type="number" min={2020} max={2030} value={ano} onChange={(e) => setAno(Number(e.target.value))} />
            </div>
          </div>
          {loading ? (
            <p>Carregando...</p>
          ) : lista.length === 0 ? (
            <p className="empty-state">Nenhum registro de presença neste mês.</p>
          ) : (
            <>
              <div className="presencas-resumo">
                <span><strong>Presenças:</strong> {totais.presenças}</span>
                <span><strong>Faltas:</strong> {totais.faltas}</span>
              </div>
              <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
                O conteúdo da aula é salvo automaticamente ao sair do campo (Tab ou clicar fora).
              </p>
              <div className="table-wrap">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Conteúdo da aula</th>
                    <th style={{ width: '1%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {listaPaginada.map((p) => {
                    const chave = String(p.id ?? p.dataAula ?? '')
                    const estaAlterando = alterandoId === chave
                    return (
                      <tr key={chave}>
                        <td>{formatarDataLocal(p.dataAula)}</td>
                        <td>
                          <span className={p.presente ? 'presenca-ok' : 'presenca-falta'}>
                            {p.presente ? 'Presença' : 'Falta'}
                          </span>
                        </td>
                        <td>
                          <textarea
                            className="chamada-conteudo-field"
                            value={p.conteudoAula ?? ''}
                            onChange={(e) => atualizarConteudoLocal(p, e.target.value)}
                            onBlur={() => salvarConteudo(p)}
                            disabled={salvandoConteudoId === chave}
                            placeholder="Descreva o conteúdo ministrado nesta aula para o aluno..."
                            rows={2}
                            aria-label="Conteúdo da aula"
                          />
                          {salvandoConteudoId === chave && <span className="text-muted" style={{ marginLeft: '0.5rem', display: 'block', marginTop: '0.25rem' }}>Salvando...</span>}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => alterarPresenca(p)}
                            disabled={estaAlterando}
                          >
                            {estaAlterando ? 'Salvando...' : (p.presente ? 'Marcar Falta' : 'Marcar Presença')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
              {totalElements > 0 && (
                <Paginacao
                  page={pageIndex}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  size={size}
                  onPageChange={setPageIndex}
                  onSizeChange={(s) => { setSize(s); setPageIndex(0); }}
                />
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onFechar}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
