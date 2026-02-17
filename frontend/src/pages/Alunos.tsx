import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import ModalAluno from '../components/ModalAluno'
import ModalPresencasAluno from '../components/ModalPresencasAluno'
import ModalConfirm from '../components/ModalConfirm'
import Paginacao from '../components/Paginacao'
import { formatarDataLocal } from '../utils/date'
import { mascaraCPF, mascaraTelefone, soNumeros } from '../utils/validacao'
import type { Aluno as AlunoType, Matricula as MatriculaType, Page } from '../types'

function pareceCPF(val: string): boolean {
  const v = val.trim()
  if (!v.length) return false
  return /^[\d.\s-]*$/.test(v) && soNumeros(v).length > 0
}

function classificacaoIdade(dataNascimento: string | undefined): '-18' | '+18' | '' {
  if (!dataNascimento) return ''
  const d = new Date(dataNascimento + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return ''
  const hoje = new Date()
  let idade = hoje.getFullYear() - d.getFullYear()
  const m = hoje.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) idade--
  return idade < 18 ? '-18' : '+18'
}

export default function Alunos() {
  const { t } = useTranslation()
  const [page, setPage] = useState<Page<AlunoType> | null>(null)
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
  const [editando, setEditando] = useState<AlunoType | null>(null)
  const [presencasAluno, setPresencasAluno] = useState<{ aluno: AlunoType; matriculas: MatriculaType[] } | null>(null)
  const [presencaModalAluno, setPresencaModalAluno] = useState<{ turmaId: number; matriculaId: number; alunoNome: string; ano: number; mes: number } | null>(null)
  const [excluindoId, setExcluindoId] = useState<number | null>(null)

  const carregar = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pageIndex), size: String(size) })
    if (busca.trim()) {
      params.set('busca', pareceCPF(busca) ? soNumeros(busca) : busca.trim())
    }
    getApiClient().get<Page<AlunoType>>(`/alunos?${params}`)
      .then((r) => setPage(r.data))
      .catch(() => setErro(t('common.errorLoading')))
      .finally(() => setLoading(false))
  }, [pageIndex, size, busca])

  useEffect(() => carregar(), [carregar])

  function abrirNovo() {
    setEditando(null)
    setModalAberto(true)
  }

  function abrirEditar(item: AlunoType) {
    setEditando(item)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditando(null)
    carregar()
  }

  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth() + 1

  async function abrirPresencas(a: AlunoType) {
    setErro('')
    try {
      const { data: matriculas } = await getApiClient().get<MatriculaType[]>(`/matriculas/aluno/${a.id}`)
      const ativas = (matriculas ?? []).filter((m) => m.ativo !== false)
      if (ativas.length === 0) {
        setErro(t('alunos.noActiveEnrollment'))
        return
      }
      if (ativas.length === 1) {
        const m = ativas[0]
        setPresencaModalAluno({
          turmaId: m.turmaId,
          matriculaId: m.id,
          alunoNome: a.nome,
          ano: anoAtual,
          mes: mesAtual
        })
        return
      }
      setPresencasAluno({ aluno: a, matriculas: ativas })
    } catch {
      setErro(t('alunos.errorLoadingEnrollments'))
    }
  }

  function fecharPresencas() {
    setPresencasAluno(null)
  }

  function excluir(id: number) {
    setExcluindoId(id)
  }

  function confirmarExclusao() {
    if (excluindoId == null) return
    getApiClient().delete(`/alunos/${excluindoId}`)
      .then(() => { setExcluindoId(null); carregar() })
      .catch((e) => { setExcluindoId(null); setErro((e as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem || 'Erro ao excluir.') })
  }

  const lista = page?.content ?? []

  return (
    <>
      <div className="page-header">
        <h1>{t('alunos.title')}</h1>
        <button type="button" className="btn btn-primary" onClick={abrirNovo}>Novo aluno</button>
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
              <p>{t('alunos.noStudentFound')}</p>
              <button type="button" className="btn btn-primary" onClick={abrirNovo}>{t('alunos.registerStudent')}</button>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>Nascimento</th>
                    <th>Classificação</th>
                    <th>Ativo</th>
                    <th className="actions-cell">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((a) => {
                    const classificacao = classificacaoIdade(a.dataNascimento)
                    return (
                    <tr key={a.id}>
                      <td>{a.nome}</td>
                      <td>{a.telefone ? mascaraTelefone(a.telefone) : '—'}</td>
                      <td>{formatarDataLocal(a.dataNascimento)}</td>
                      <td>
                        {classificacao === '-18' && <span className="badge badge-danger">-18</span>}
                        {classificacao === '+18' && <span className="badge badge-success">+18</span>}
                        {!classificacao && '—'}
                      </td>
                      <td>{a.ativo !== false ? <span className="badge badge-success">Sim</span> : <span className="badge badge-danger">Não</span>}</td>
                      <td className="actions-cell">
                        <button type="button" className="btn btn-outline" onClick={() => abrirPresencas(a)}>Ver presenças e faltas</button>
                        <button type="button" className="btn btn-outline" onClick={() => abrirEditar(a)}>{t('common.edit')}</button>
                        <button type="button" className="btn btn-danger" onClick={() => excluir(a.id)}>{t('common.delete')}</button>
                      </td>
                    </tr>
                  );
                  })}
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
        <ModalAluno
          aluno={editando}
          onFechar={fecharModal}
          onSalvo={fecharModal}
        />
      )}
      {presencasAluno && (
        <div className="modal-overlay" onClick={fecharPresencas}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Presenças e faltas — {presencasAluno.aluno.nome}</h2>
            </div>
            <div className="modal-body">
              <p className="form-hint">Selecione a turma para ver as presenças e faltas do aluno.</p>
              <ul className="presencas-turmas-list">
                {presencasAluno.matriculas.map((m) => (
                  <li key={m.id}>
                    <span>{m.turmaDescricao ?? `Turma ${m.turmaId}`}</span>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setPresencaModalAluno({
                          turmaId: m.turmaId,
                          matriculaId: m.id,
                          alunoNome: presencasAluno.aluno.nome,
                          ano: anoAtual,
                          mes: mesAtual
                        })
                      }}
                    >
                      Ver presenças e faltas
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={fecharPresencas}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {presencaModalAluno && (
        <ModalPresencasAluno
          key={`presenca-${presencaModalAluno.turmaId}-${presencaModalAluno.matriculaId}-${presencaModalAluno.ano}-${presencaModalAluno.mes}`}
          turmaId={presencaModalAluno.turmaId}
          matriculaId={presencaModalAluno.matriculaId}
          alunoNome={presencaModalAluno.alunoNome}
          ano={presencaModalAluno.ano}
          mes={presencaModalAluno.mes}
          onFechar={() => setPresencaModalAluno(null)}
        />
      )}
      {excluindoId != null && (
        <ModalConfirm
          titulo={t('alunos.deleteStudent')}
          mensagem={t('alunos.deleteStudentConfirm')}
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
