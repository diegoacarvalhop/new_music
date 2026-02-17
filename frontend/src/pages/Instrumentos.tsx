import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import ModalInstrumento from '../components/ModalInstrumento'
import ModalConfirm from '../components/ModalConfirm'
import Paginacao from '../components/Paginacao'
import SelectSearch from '../components/SelectSearch'
import type { Instrumento as InstrumentoType, Page } from '../types'

export default function Instrumentos() {
  const { t } = useTranslation()
  const [page, setPage] = useState<Page<InstrumentoType> | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [size, setSize] = useState(10)
  const [grupoFiltro, setGrupoFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<InstrumentoType | null>(null)
  const [excluindoId, setExcluindoId] = useState<number | null>(null)

  const carregar = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pageIndex), size: String(size) })
    if (grupoFiltro) params.set('grupoId', grupoFiltro)
    getApiClient().get<Page<InstrumentoType>>(`/instrumentos?${params}`)
      .then((r) => setPage(r.data))
      .catch(() => setErro(t('common.errorLoading')))
      .finally(() => setLoading(false))
  }, [pageIndex, size, grupoFiltro])

  useEffect(() => carregar(), [carregar])

  function abrirNovo() {
    setEditando(null)
    setModalAberto(true)
  }

  function abrirEditar(item: InstrumentoType) {
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
    getApiClient().delete(`/instrumentos/${excluindoId}`)
      .then(() => { setExcluindoId(null); carregar() })
      .catch((e) => { setExcluindoId(null); setErro((e as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem || t('common.errorDeleting')) })
  }

  const lista = page?.content ?? []

  return (
    <>
      <div className="page-header">
        <h1>{t('instrumentos.title')}</h1>
        <button type="button" className="btn btn-primary" onClick={abrirNovo}>{t('instrumentos.newInstrument')}</button>
      </div>
      <div className="busca-wrap">
        <div className="form-group">
          <label htmlFor="filtro-grupo-instrumentos">{t('instrumentos.group')}</label>
          <SelectSearch
            id="filtro-grupo-instrumentos"
            value={grupoFiltro}
            onChange={(val) => { setGrupoFiltro(val); setPageIndex(0); }}
            searchUrl="/grupos"
            placeholder={t('instrumentos.allGroups')}
            emptyOption={{ value: '', label: t('instrumentos.allGroups') }}
            aria-label={t('instrumentos.filterByGroup')}
          />
        </div>
      </div>
      {erro && <div className="alert alert-error">{erro}</div>}
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <div className="card">
          {lista.length === 0 ? (
            <div className="empty-state">
              <p>{t('instrumentos.noInstrumentFound')}</p>
              <button type="button" className="btn btn-primary" onClick={abrirNovo}>{t('instrumentos.registerInstrument')}</button>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('instrumentos.group')}</th>
                    <th>{t('instrumentos.description')}</th>
                    <th>{t('matriculas.active')}</th>
                    <th className="actions-cell">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((i) => (
                    <tr key={i.id}>
                      <td>{i.nome}</td>
                      <td>{i.grupoNome || '—'}</td>
                      <td>{i.descricao || '—'}</td>
                      <td>{i.ativo ? <span className="badge badge-success">{t('common.yes')}</span> : <span className="badge badge-danger">{t('common.no')}</span>}</td>
                      <td className="actions-cell">
                        <button type="button" className="btn btn-outline" onClick={() => abrirEditar(i)}>{t('common.edit')}</button>
                        <button type="button" className="btn btn-danger" onClick={() => excluir(i.id)}>{t('common.delete')}</button>
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
        <ModalInstrumento
          instrumento={editando}
          onFechar={fecharModal}
          onSalvo={fecharModal}
        />
      )}
      {excluindoId != null && (
        <ModalConfirm
          titulo={t('instrumentos.deleteInstrument')}
          mensagem={t('instrumentos.deleteInstrumentConfirm')}
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
