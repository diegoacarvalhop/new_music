import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import Paginacao from './Paginacao'
import SelectSearch from './SelectSearch'
import { formatarDataLocal } from '../utils/date'
import type { PresencaProfessorRegistro } from '../types'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

interface ModalPresencasProfessorProps {
  professorId: number
  professorNome: string
  ano: number
  mes: number
  podeAlterar: boolean
  onFechar: () => void
}

export default function ModalPresencasProfessor({ professorId, professorNome, ano: anoInicial, mes: mesInicial, podeAlterar, onFechar }: ModalPresencasProfessorProps) {
  const { t } = useTranslation()
  const [ano, setAno] = useState(anoInicial)
  const [mes, setMes] = useState(mesInicial)
  const [lista, setLista] = useState<PresencaProfessorRegistro[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [alterandoChave, setAlterandoChave] = useState<string | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [size, setSize] = useState(10)

  useEffect(() => {
    setAno(anoInicial)
    setMes(mesInicial)
  }, [anoInicial, mesInicial])

  const carregar = useCallback(() => {
    setLoading(true)
    setErro('')
    getApiClient()
      .get<PresencaProfessorRegistro[]>(`/professores/${professorId}/presencas/mes`, { params: { ano, mes } })
      .then((r) => setLista(r.data || []))
      .catch(() => setErro('Erro ao carregar presenças.'))
      .finally(() => setLoading(false))
  }, [professorId, ano, mes])

  useEffect(() => {
    carregar()
  }, [carregar])

  function alterarPresenca(p: PresencaProfessorRegistro) {
    const dataAula = p.dataAula?.slice(0, 10)
    if (!dataAula || !p.turmaId) return
    const novoPresente = !(p.presente !== false)
    const chave = `${p.dataAula}-${p.turmaId}`
    setAlterandoChave(chave)
    setErro('')
    getApiClient()
      .post(`/professores/${professorId}/presencas`, {
        dataAula,
        registros: [{ turmaId: p.turmaId, presente: novoPresente }]
      })
      .then(() => {
        setLista((prev) =>
          prev.map((item) =>
            item.dataAula === p.dataAula && item.turmaId === p.turmaId
              ? { ...item, presente: novoPresente }
              : item
          )
        )
      })
      .catch(() => setErro('Erro ao alterar presença.'))
      .finally(() => setAlterandoChave(null))
  }

  const mesNome = MESES[mes - 1] ?? ''
  const totais = lista.reduce((acc, p) => {
    if (p.presente !== false) acc.presenças += 1
    else acc.faltas += 1
    return acc
  }, { presenças: 0, faltas: 0 })

  const totalElements = lista.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const listaPaginada = lista.slice(pageIndex * size, pageIndex * size + size)

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
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Turma / Aula</th>
                    <th>Status</th>
                    {podeAlterar && <th style={{ width: '1%' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {listaPaginada.map((p) => {
                    const chave = `${p.dataAula}-${p.turmaId}`
                    const estaAlterando = alterandoChave === chave
                    return (
                      <tr key={chave}>
                        <td>{formatarDataLocal(p.dataAula)}</td>
                        <td>{p.turmaDescricao ?? `Turma ${p.turmaId}`}</td>
                        <td>
                          <span className={p.presente !== false ? 'presenca-ok' : 'presenca-falta'}>
                            {p.presente !== false ? 'Presença' : 'Falta'}
                          </span>
                        </td>
                        {podeAlterar && (
                          <td>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => alterarPresenca(p)}
                              disabled={estaAlterando}
                            >
                              {estaAlterando ? 'Salvando...' : (p.presente !== false ? 'Marcar Falta' : 'Marcar Presença')}
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
