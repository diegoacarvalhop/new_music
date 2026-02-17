import { useState, useEffect, useCallback, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import ModalTurma from '../components/ModalTurma'
import ModalChamada from '../components/ModalChamada'
import ModalConfirm from '../components/ModalConfirm'
import Paginacao from '../components/Paginacao'
import { formatarDiasHorariosTurma } from '../utils/turma'
import type { Turma as TurmaType, Page } from '../types'

export default function Turmas() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isProfessor = user?.perfil === 'PROFESSOR'

  const [page, setPage] = useState<Page<TurmaType> | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [size, setSize] = useState(10)
  const [busca, setBusca] = useState('')
  const [buscaInput, setBuscaInput] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isProfessor) return
    const t = setTimeout(() => {
      setBusca(buscaInput)
      setPageIndex(0)
    }, 300)
    return () => clearTimeout(t)
  }, [isProfessor, buscaInput])
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<TurmaType | null>(null)
  const [chamadaTurma, setChamadaTurma] = useState<TurmaType | null>(null)
  const [expandidoId, setExpandidoId] = useState<number | null>(null)
  const [excluindoId, setExcluindoId] = useState<number | null>(null)

  const carregar = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pageIndex), size: String(size) })
    if (!isProfessor && busca.trim()) params.set('busca', busca.trim())
    getApiClient().get<Page<TurmaType>>(`/turmas?${params}`)
      .then((r) => setPage(r.data))
      .catch(() => setErro(t('common.errorLoading')))
      .finally(() => setLoading(false))
  }, [pageIndex, size, busca, isProfessor])

  useEffect(() => carregar(), [carregar])

  function abrirNovo() {
    setEditando(null)
    setModalAberto(true)
  }

  function abrirEditar(item: TurmaType) {
    setEditando(item)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditando(null)
    carregar()
  }

  function abrirChamada(t: TurmaType) {
    setChamadaTurma(t)
  }

  function fecharChamada() {
    setChamadaTurma(null)
  }

  function excluir(id: number) {
    setExcluindoId(id)
  }

  function confirmarExclusao() {
    if (excluindoId == null) return
    getApiClient().delete(`/turmas/${excluindoId}`)
      .then(() => { setExcluindoId(null); carregar() })
      .catch((e) => { setExcluindoId(null); setErro((e as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem || t('common.errorDeleting')) })
  }

  const lista = page?.content ?? []

  return (
    <>
      <div className="page-header">
        <h1>{t('turmas.title')}</h1>
        {!isProfessor && (
          <button type="button" className="btn btn-primary" onClick={abrirNovo}>{t('turmas.newClass')}</button>
        )}
      </div>
      {erro && <div className="alert alert-error">{erro}</div>}
      {!isProfessor && (
        <div className="busca-wrap">
          <input
            type="search"
            placeholder={t('turmas.searchPlaceholder')}
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
            aria-label={t('turmas.searchPlaceholder')}
          />
        </div>
      )}
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <div className="card">
          {lista.length === 0 ? (
            <div className="empty-state">
              <p>{t('turmas.noClassFound')}</p>
              {!isProfessor && (
                <button type="button" className="btn btn-primary" onClick={abrirNovo}>{t('turmas.registerClass')}</button>
              )}
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                <thead>
                  <tr>
                    <th style={{ width: '32px' }}></th>
                    <th>{t('turmas.instrument')}</th>
                    {!isProfessor && <th>{t('turmas.teacher')}</th>}
                    <th>{t('turmas.capacity')}</th>
                    <th>{t('turmas.daysAndTimes')}</th>
                    <th>{t('matriculas.active')}</th>
                    <th className="actions-cell">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((turma) => (
                    <Fragment key={turma.id}>
                      <tr>
                        <td>
                          <button
                            type="button"
                            className="turma-expand-btn"
                            onClick={() => setExpandidoId(expandidoId === turma.id ? null : turma.id)}
                            title={(turma.alunos?.length ?? 0) > 0 ? t('turmas.seeStudents') : t('turmas.noStudents')}
                            aria-expanded={expandidoId === turma.id}
                          >
                            {(turma.alunos?.length ?? 0) > 0 ? (expandidoId === turma.id ? '−' : '+') : '·'}
                          </button>
                        </td>
                        <td>{turma.instrumentoNome}</td>
                        {!isProfessor && <td>{turma.professorNome}</td>}
                        <td>{turma.capacidade != null && turma.capacidadePreenchida != null ? `${turma.capacidadePreenchida}/${turma.capacidade}` : (turma.capacidade ?? '—')}</td>
                        <td>{formatarDiasHorariosTurma(turma)}</td>
                        <td>{turma.ativo !== false ? <span className="badge badge-success">{t('common.yes')}</span> : <span className="badge badge-danger">{t('common.no')}</span>}</td>
                        <td className="actions-cell">
                          <button type="button" className="btn btn-outline" onClick={() => abrirChamada(turma)}>{t('professores.attendance')}</button>
                          {!isProfessor && (
                            <>
                              <button type="button" className="btn btn-outline" onClick={() => abrirEditar(turma)}>{t('common.edit')}</button>
                              <button type="button" className="btn btn-danger" onClick={() => excluir(turma.id)}>{t('common.delete')}</button>
                            </>
                          )}
                        </td>
                      </tr>
                      {expandidoId === turma.id && (turma.alunos?.length ?? 0) > 0 && (
                        <tr key={`${turma.id}-alunos`} className="turma-alunos-row">
                          <td colSpan={isProfessor ? 6 : 7}>
                            <div className="turma-alunos-wrap">
                              <strong>{t('turmas.studentsLabel')}</strong>
                              <ul className="turma-alunos-list">
                                {turma.alunos!.map((nome, i) => (
                                  <li key={i}>{nome}</li>
                                ))}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
        <ModalTurma
          turma={editando}
          onFechar={fecharModal}
          onSalvo={fecharModal}
        />
      )}
      {chamadaTurma && (
        <ModalChamada
          turma={chamadaTurma}
          onFechar={fecharChamada}
          onSalvo={fecharChamada}
        />
      )}
      {excluindoId != null && (
        <ModalConfirm
          titulo={t('turmas.deleteClass')}
          mensagem={t('turmas.deleteClassConfirm')}
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
