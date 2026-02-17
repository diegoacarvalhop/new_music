import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { mascaraCPF, soNumeros } from '../utils/validacao'
import ModalProfessor from '../components/ModalProfessor'
import ModalChamadaProfessor from '../components/ModalChamadaProfessor'
import ModalPresencasProfessor from '../components/ModalPresencasProfessor'
import ModalConfirm from '../components/ModalConfirm'
import Paginacao from '../components/Paginacao'
import type { Professor as ProfessorType, Page } from '../types'

function pareceCPF(val: string): boolean {
  const v = val.trim()
  if (!v.length) return false
  return /^[\d.\s-]*$/.test(v) && soNumeros(v).length > 0
}

export default function Professores() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = user?.perfil === 'ADMINISTRADOR'
  const [page, setPage] = useState<Page<ProfessorType> | null>(null)
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
  const [editando, setEditando] = useState<ProfessorType | null>(null)
  const [chamadaProfessor, setChamadaProfessor] = useState<ProfessorType | null>(null)
  const [presencasProfessor, setPresencasProfessor] = useState<ProfessorType | null>(null)
  const [excluindoId, setExcluindoId] = useState<number | null>(null)

  const carregar = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pageIndex), size: String(size) })
    if (busca.trim()) {
      params.set('busca', pareceCPF(busca) ? soNumeros(busca) : busca.trim())
    }
    getApiClient().get<Page<ProfessorType>>(`/professores?${params}`)
      .then((r) => setPage(r.data))
      .catch(() => setErro(t('common.errorLoading')))
      .finally(() => setLoading(false))
  }, [pageIndex, size, busca])

  useEffect(() => carregar(), [carregar])

  function abrirNovo() {
    setEditando(null)
    setModalAberto(true)
  }

  function abrirEditar(item: ProfessorType) {
    setEditando(item)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditando(null)
    carregar()
  }

  function abrirChamada(p: ProfessorType) {
    setChamadaProfessor(p)
  }

  function fecharChamada() {
    setChamadaProfessor(null)
  }

  function abrirPresencas(p: ProfessorType) {
    setPresencasProfessor(p)
  }

  function fecharPresencas() {
    setPresencasProfessor(null)
  }

  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth() + 1

  function excluir(id: number) {
    setExcluindoId(id)
  }

  function confirmarExclusao() {
    if (excluindoId == null) return
    getApiClient().delete(`/professores/${excluindoId}`)
      .then(() => { setExcluindoId(null); carregar() })
      .catch((e) => { setExcluindoId(null); setErro((e as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem || t('common.errorDeleting')) })
  }

  const lista = page?.content ?? []

  return (
    <>
      <div className="page-header">
        <h1>{t('professores.title')}</h1>
        <button type="button" className="btn btn-primary" onClick={abrirNovo}>{t('professores.newProfessor')}</button>
      </div>
      {erro && <div className="alert alert-error">{erro}</div>}
      <div className="busca-wrap">
        <input
          type="search"
          placeholder={t('professores.searchPlaceholder')}
          value={buscaInput}
          onChange={(e) => {
            const v = e.target.value
            setBuscaInput(pareceCPF(v) ? mascaraCPF(v) : v)
          }}
          aria-label={t('professores.searchPlaceholder')}
        />
      </div>
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <div className="card">
          {lista.length === 0 ? (
            <div className="empty-state">
              <p>{t('professores.noProfessorFound')}</p>
              <button type="button" className="btn btn-primary" onClick={abrirNovo}>{t('professores.registerProfessor')}</button>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('common.email')}</th>
                    <th>{t('nav.instrumentos')}</th>
                    <th>{t('matriculas.active')}</th>
                    <th className="actions-cell">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((p) => (
                    <tr key={p.id}>
                      <td>{p.nome}</td>
                      <td>{p.email}</td>
                      <td>{p.instrumentos || '—'}</td>
                      <td>{p.ativo ? <span className="badge badge-success">{t('common.yes')}</span> : <span className="badge badge-danger">{t('common.no')}</span>}</td>
                      <td className="actions-cell">
                        {isAdmin && (
                          <>
                            <button type="button" className="btn btn-primary" onClick={() => abrirChamada(p)}>{t('professores.attendance')}</button>
                            <button type="button" className="btn btn-outline" onClick={() => abrirPresencas(p)}>{t('professores.viewPresencasFaltas')}</button>
                          </>
                        )}
                        <button type="button" className="btn btn-outline" onClick={() => abrirEditar(p)}>{t('common.edit')}</button>
                        <button type="button" className="btn btn-danger" onClick={() => excluir(p.id)}>{t('common.delete')}</button>
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
        <ModalProfessor
          professor={editando}
          onFechar={fecharModal}
          onSalvo={fecharModal}
        />
      )}
      {chamadaProfessor && (
        <ModalChamadaProfessor
          professor={chamadaProfessor}
          onFechar={fecharChamada}
          onSalvo={fecharChamada}
        />
      )}
      {presencasProfessor && (
        <ModalPresencasProfessor
          professorId={presencasProfessor.id}
          professorNome={presencasProfessor.nome}
          ano={anoAtual}
          mes={mesAtual}
          podeAlterar={isAdmin}
          onFechar={fecharPresencas}
        />
      )}
      {excluindoId != null && (
        <ModalConfirm
          titulo={t('professores.deleteProfessor')}
          mensagem={t('professores.deleteProfessorConfirm')}
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
