import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import ModalMatricula from '../components/ModalMatricula'
import ModalConfirm from '../components/ModalConfirm'
import Paginacao from '../components/Paginacao'
import { formatarDataLocal } from '../utils/date'
import { mascaraCPF, soNumeros } from '../utils/validacao'
import type { Matricula as MatriculaType, Page } from '../types'

function pareceCPF(val: string): boolean {
  const v = val.trim()
  if (!v.length) return false
  return /^[\d.\s-]*$/.test(v) && soNumeros(v).length > 0
}

export default function Matriculas() {
  const { t } = useTranslation()
  const [page, setPage] = useState<Page<MatriculaType> | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [size, setSize] = useState(10)
  const [busca, setBusca] = useState('')
  const [buscaInput, setBuscaInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setBusca(buscaInput)
      setPageIndex(0)
    }, 300)
    return () => clearTimeout(t)
  }, [buscaInput])
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<MatriculaType | null>(null)
  const [excluindoId, setExcluindoId] = useState<number | null>(null)

  const carregar = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pageIndex), size: String(size) })
    if (busca.trim()) params.set('busca', pareceCPF(busca) ? soNumeros(busca) : busca.trim())
    getApiClient().get<Page<MatriculaType>>(`/matriculas?${params}`)
      .then((r) => setPage(r.data))
      .catch(() => setErro(t('common.errorLoading')))
      .finally(() => setLoading(false))
  }, [pageIndex, size, busca])

  useEffect(() => carregar(), [carregar])

  function abrirNovo() {
    setEditando(null)
    setModalAberto(true)
  }

  function abrirEditar(item: MatriculaType) {
    setEditando(item)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditando(null)
    carregar()
  }

  function excluir(id: number) {
    setExcluindoId(id)
  }

  function confirmarExclusao() {
    if (excluindoId == null) return
    getApiClient().delete(`/matriculas/${excluindoId}`)
      .then(() => { setExcluindoId(null); carregar() })
      .catch((e) => { setExcluindoId(null); setErro((e as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem || t('common.errorDeleting')) })
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const lista = page?.content ?? []

  return (
    <>
      <div className="page-header">
        <h1>{t('matriculas.title')}</h1>
        <button type="button" className="btn btn-primary" onClick={abrirNovo}>{t('matriculas.newEnrollment')}</button>
      </div>
      {erro && <div className="alert alert-error">{erro}</div>}
      <div className="busca-wrap">
        <input
          type="search"
          placeholder={t('common.searchByNameOrCpf')}
          value={buscaInput}
          onChange={(e) => {
            const v = e.target.value
            setBuscaInput(pareceCPF(v) ? mascaraCPF(v) : v)
          }}
          aria-label={t('common.searchByNameOrCpf')}
        />
      </div>
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <div className="card">
          {lista.length === 0 ? (
            <div className="empty-state">
              <p>{t('matriculas.noEnrollmentFound')}</p>
              <button type="button" className="btn btn-primary" onClick={abrirNovo}>{t('matriculas.registerEnrollment')}</button>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                <thead>
                  <tr>
                    <th>{t('matriculas.student')}</th>
                    <th>{t('matriculas.startDate')}</th>
                    <th>{t('matriculas.endDate')}</th>
                    <th>{t('matriculas.active')}</th>
                    <th className="actions-cell">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((m) => (
                    <tr key={m.id}>
                      <td>{m.alunoNome}</td>
                      <td>{formatarDataLocal(m.dataInicio)}</td>
                      <td>{formatarDataLocal(m.dataFim) || '—'}</td>
                      <td>{m.ativo ? <span className="badge badge-success">{t('common.yes')}</span> : <span className="badge badge-danger">{t('common.no')}</span>}</td>
                      <td className="actions-cell">
                        <button type="button" className="btn btn-outline" onClick={() => abrirEditar(m)}>{t('common.edit')}</button>
                        <button type="button" className="btn btn-danger" onClick={() => excluir(m.id)}>{t('common.delete')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {page && page.totalPages > 0 && (
                <Paginacao
                  page={page.number}
                  totalPages={page.totalPages}
                  totalElements={page.totalElements}
                  size={page.size}
                  onPageChange={setPageIndex}
                  onSizeChange={(s) => { setSize(s); setPageIndex(0); }}
                />
              )}
            </>
          )}
        </div>
      )}
      {modalAberto && (
        <ModalMatricula
          matricula={editando}
          onFechar={fecharModal}
          onSalvo={fecharModal}
        />
      )}
      {excluindoId != null && (
        <ModalConfirm
          titulo={t('matriculas.deleteEnrollment')}
          mensagem={t('matriculas.deleteEnrollmentConfirm')}
          confirmarTexto={t('common.delete')}
          cancelarTexto={t('common.cancel')}
          perigo
          onConfirmar={confirmarExclusao}
          onCancelar={() => setExcluindoId(null)}
        />
      )}
    </>
  )
}
