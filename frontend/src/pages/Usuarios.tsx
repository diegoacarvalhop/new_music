import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import ModalUsuario from '../components/ModalUsuario'
import ModalConfirm from '../components/ModalConfirm'
import Paginacao from '../components/Paginacao'
import type { Usuario, Page } from '../types'

export default function Usuarios() {
  const { t } = useTranslation()
  const [page, setPage] = useState<Page<Usuario> | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [size, setSize] = useState(10)
  const [busca, setBusca] = useState('')
  const [buscaInput, setBuscaInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [excluindoId, setExcluindoId] = useState<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setBusca(buscaInput)
      setPageIndex(0)
    }, 300)
    return () => clearTimeout(t)
  }, [buscaInput])

  const carregar = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pageIndex), size: String(size) })
    if (busca.trim()) params.set('busca', busca.trim())
    getApiClient().get<Page<Usuario>>(`/usuarios?${params}`)
      .then((r) => setPage(r.data))
      .catch(() => setErro(t('common.errorLoading')))
      .finally(() => setLoading(false))
  }, [pageIndex, size, busca])

  useEffect(() => carregar(), [carregar])

  function abrirNovo() {
    setEditando(null)
    setModalAberto(true)
  }

  function abrirEditar(item: Usuario) {
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
    getApiClient().delete(`/usuarios/${excluindoId}`)
      .then(() => { setExcluindoId(null); carregar() })
      .catch((e) => {
        setExcluindoId(null)
        setErro((e as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem || t('common.errorDeleting'))
      })
  }

  const lista = page?.content ?? []

  const perfilLabel: Record<string, string> = {
    ADMINISTRADOR: t('usuarios.profileAdmin'),
    PROFESSOR: t('usuarios.profileProfessor'),
    FUNCIONARIO: t('usuarios.profileFuncionario')
  }

  return (
    <>
      <div className="page-header">
        <h1>{t('usuarios.title')}</h1>
        <button type="button" className="btn btn-primary" onClick={abrirNovo}>{t('usuarios.newUser')}</button>
      </div>
      {erro && <div className="alert alert-error">{erro}</div>}
      <div className="busca-wrap">
        <input
          type="search"
          placeholder={t('common.searchByNameOrEmail')}
          value={buscaInput}
          onChange={(e) => setBuscaInput(e.target.value)}
          aria-label={t('common.searchByNameOrEmail')}
        />
      </div>
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <div className="card">
          {lista.length === 0 ? (
            <div className="empty-state">
              <p>{t('usuarios.noUserFound')}</p>
              <button type="button" className="btn btn-primary" onClick={abrirNovo}>{t('usuarios.registerUser')}</button>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('common.email')}</th>
                    <th>{t('usuarios.profile')}</th>
                    <th>{t('matriculas.active')}</th>
                    <th className="actions-cell">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((u) => (
                    <tr key={u.id}>
                      <td>{u.nome}</td>
                      <td>{u.email}</td>
                      <td>{(perfilLabel[u.perfil] ?? u.perfil).toUpperCase()}</td>
                      <td>{u.ativo ? <span className="badge badge-success">{t('common.yes')}</span> : <span className="badge badge-danger">{t('common.no')}</span>}</td>
                      <td className="actions-cell">
                        <button type="button" className="btn btn-outline" onClick={() => abrirEditar(u)}>{t('common.edit')}</button>
                        <button type="button" className="btn btn-danger" onClick={() => excluir(u.id)}>{t('common.delete')}</button>
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
        <ModalUsuario
          usuario={editando}
          onFechar={fecharModal}
          onSalvo={fecharModal}
        />
      )}
      {excluindoId != null && (
        <ModalConfirm
          titulo={t('usuarios.deleteUser')}
          mensagem={t('usuarios.deleteUserConfirm')}
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
