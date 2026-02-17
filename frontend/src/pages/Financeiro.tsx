import { useState, useEffect, useCallback, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import ModalMensalidade from '../components/ModalMensalidade'
import ModalBaixa from '../components/ModalBaixa'
import Paginacao from '../components/Paginacao'
import { formatarDataLocal } from '../utils/date'
import { obterCidadePorGeolocalizacao, abrirReciboParaImpressao } from '../utils/recibo'
import type { Mensalidade as MensalidadeType, Page, AlunoMensalidadeResumo } from '../types'

interface ParcelasPageState {
  data: Page<MensalidadeType>
  pageIndex: number
  size: number
}

export default function Financeiro() {
  const { t, i18n } = useTranslation()
  const [pageAlunos, setPageAlunos] = useState<Page<AlunoMensalidadeResumo> | null>(null)
  const [alunoPageIndex, setAlunoPageIndex] = useState(0)
  const [alunoSize, setAlunoSize] = useState(10)
  const [busca, setBusca] = useState('')
  const [buscaInput, setBuscaInput] = useState('')
  const [alunosComMatriculaAtiva, setAlunosComMatriculaAtiva] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [modalBaixaAberto, setModalBaixaAberto] = useState(false)
  const [mensalidadeBaixa, setMensalidadeBaixa] = useState<MensalidadeType | null>(null)
  const [itemBaixaAtual, setItemBaixaAtual] = useState<AlunoMensalidadeResumo | null>(null)
  const [expandidoRowKey, setExpandidoRowKey] = useState<string | null>(null)
  const [parcelasPorRow, setParcelasPorRow] = useState<Record<string, ParcelasPageState>>({})
  const [loadingParcelas, setLoadingParcelas] = useState<string | null>(null)
  const [reimprimindoId, setReimprimindoId] = useState<number | null>(null)
  const [modalCalculoParcela, setModalCalculoParcela] = useState<MensalidadeType | null>(null)

  function rowKey(item: AlunoMensalidadeResumo): string {
    return item.matriculaId != null ? `m${item.matriculaId}` : `a${item.alunoId}`
  }

  const listaAlunos = pageAlunos?.content ?? []

  useEffect(() => {
    const t = setTimeout(() => {
      setBusca(buscaInput)
      setAlunoPageIndex(0)
    }, 300)
    return () => clearTimeout(t)
  }, [buscaInput])

  const carregarAlunos = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(alunoPageIndex), size: String(alunoSize) })
    if (busca.trim()) params.set('busca', busca.trim())
    Promise.all([
      getApiClient().get<Page<AlunoMensalidadeResumo>>(`/mensalidades/alunos?${params}`),
      getApiClient().get<number[]>('/matriculas/alunos-ativos')
    ])
      .then(([alunosRes, ativosRes]) => {
        setPageAlunos(alunosRes.data)
        setAlunosComMatriculaAtiva(new Set(ativosRes.data))
      })
      .catch(() => setErro(t('common.errorLoading')))
      .finally(() => setLoading(false))
  }, [alunoPageIndex, alunoSize, busca])

  useEffect(() => carregarAlunos(), [carregarAlunos])

  const carregarParcelas = useCallback((key: string, matriculaId: number | null, alunoId: number, pageIndex: number, size: number) => {
    setLoadingParcelas(key)
    const params = new URLSearchParams({ page: String(pageIndex), size: String(size) })
    const url = matriculaId != null
      ? `/mensalidades/matricula/${matriculaId}/parcelas?${params}`
      : `/mensalidades/aluno/${alunoId}/parcelas?${params}`
    getApiClient()
      .get<Page<MensalidadeType>>(url)
      .then((r) => {
        setParcelasPorRow((prev) => ({
          ...prev,
          [key]: { data: r.data, pageIndex, size }
        }))
      })
      .finally(() => setLoadingParcelas(null))
  }, [])

  function aoExpandirRow(item: AlunoMensalidadeResumo) {
    const key = rowKey(item)
    const era = expandidoRowKey
    setExpandidoRowKey(era === key ? null : key)
    if (era !== key) {
      const existente = parcelasPorRow[key]
      if (existente) return
      carregarParcelas(key, item.matriculaId ?? null, item.alunoId, 0, 10)
    }
  }

  function setParcelasPage(key: string, matriculaId: number | null, alunoId: number, pageIndex: number) {
    const s = parcelasPorRow[key]
    if (!s) return
    carregarParcelas(key, matriculaId, alunoId, pageIndex, s.size)
  }

  function setParcelasSize(key: string, matriculaId: number | null, alunoId: number, size: number) {
    carregarParcelas(key, matriculaId, alunoId, 0, size)
  }

  function abrirNovo() {
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    carregarAlunos()
  }

  function abrirBaixa(m: MensalidadeType, item: AlunoMensalidadeResumo) {
    setMensalidadeBaixa(m)
    setItemBaixaAtual(item)
    setModalBaixaAberto(true)
  }

  async function reimprimirRecibo(m: MensalidadeType, item: AlunoMensalidadeResumo) {
    if (m.status !== 'PAGO' || !m.dataPagamento) return
    setReimprimindoId(m.id)
    const cidade = await obterCidadePorGeolocalizacao()
    const multa = m.valorMulta ?? 0
    const juros = m.valorJuros ?? 0
    abrirReciboParaImpressao(
      {
        alunoNome: m.alunoNome ?? '',
        alunoCpf: m.alunoCpf,
        mes: m.mes,
        ano: m.ano,
        vencimento: m.vencimento ?? '',
        dataPagamento: m.dataPagamento,
        formaPagamento: m.formaPagamento ?? '',
        valor: m.valor ?? 0,
        valorMulta: multa > 0 ? multa : undefined,
        valorJuros: juros > 0 ? juros : undefined,
        turmaDescricao: item.turmaDescricao ?? undefined,
        turmaDiasHorarios: item.turmaDiasHorarios ?? undefined
      },
      cidade || 'Não informada'
    )
    setReimprimindoId(null)
  }

  function fecharBaixa() {
    setModalBaixaAberto(false)
    setMensalidadeBaixa(null)
    setItemBaixaAtual(null)
    carregarAlunos()
    if (expandidoRowKey != null && parcelasPorRow[expandidoRowKey]) {
      const s = parcelasPorRow[expandidoRowKey]
      const item = listaAlunos.find((i) => rowKey(i) === expandidoRowKey)
      if (item) carregarParcelas(expandidoRowKey, item.matriculaId ?? null, item.alunoId, s.pageIndex, s.size)
    }
  }

  const localeMoeda = i18n.language === 'pt-BR' ? 'pt-BR' : i18n.language === 'es' ? 'es' : 'en'
  const formatarMoeda = (v: number | null | undefined) => v != null ? new Intl.NumberFormat(localeMoeda, { style: 'currency', currency: 'BRL' }).format(v) : '—'

  /** Data de referência para dias em atraso: só conta um novo dia após 9h (Recife), igual ao job do backend. */
  const dataReferenciaParaJuros = (): Date => {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Recife', hour: 'numeric', hour12: false })
    const hourRecife = parseInt(formatter.format(new Date()), 10)
    const d = new Date()
    if (hourRecife < 9) {
      d.setDate(d.getDate() - 1)
    }
    return d
  }

  const diasEmAtraso = (vencimento: string | undefined): number => {
    if (!vencimento) return 0
    const venc = new Date(vencimento + 'T12:00:00')
    const ref = dataReferenciaParaJuros()
    ref.setHours(12, 0, 0, 0)
    if (venc.getTime() >= ref.getTime()) return 0
    return Math.floor((ref.getTime() - venc.getTime()) / (24 * 60 * 60 * 1000))
  }

  /** Juros = 1% ao dia sobre o valor da parcela (calculado, não o valor armazenado). */
  const jurosCalculado = (valor: number, dias: number): number => {
    if (dias <= 0) return 0
    return Math.round(valor * 0.01 * dias * 100) / 100
  }

  const statusBadge = (s: string | undefined, matriculaAtiva: boolean) => {
    if (s === 'PAGO') return <span className="badge badge-success">{t('financeiro.paid')}</span>
    if (!matriculaAtiva && (s === 'PENDENTE' || s === 'ATRASADO')) return <span className="badge badge-inactive">{t('financeiro.inactiveEnrollment')}</span>
    if (s === 'ATRASADO') return <span className="badge badge-danger">{t('financeiro.overdue')}</span>
    return <span className="badge badge-warning">{t('financeiro.pending')}</span>
  }

  return (
    <>
      <div className="page-header">
        <h1>{t('financeiro.title')}</h1>
        <button type="button" className="btn btn-primary" onClick={abrirNovo}>{t('financeiro.newMensalidade')}</button>
      </div>
      {erro && <div className="alert alert-error">{erro}</div>}
      <div className="busca-wrap">
        <input
          type="search"
          placeholder={t('financeiro.nameOrCpf')}
          value={buscaInput}
          onChange={(e) => setBuscaInput(e.target.value)}
          aria-label={t('common.searchByNameOrCpf')}
        />
      </div>
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <div className="card">
          {listaAlunos.length === 0 ? (
            <div className="empty-state">
              <p>{t('financeiro.noStudents')}</p>
              <button type="button" className="btn btn-primary" onClick={abrirNovo}>{t('financeiro.registerMensalidade')}</button>
            </div>
          ) : (
            <>
              <div className="table-wrap">
              <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>{t('financeiro.studentColumn')}</th>
                    <th>{t('financeiro.classOrCourse')}</th>
                    <th>{t('financeiro.installmentsHeader')}</th>
                    <th className="actions-cell">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {listaAlunos.map((item) => {
                    const key = rowKey(item)
                    const { alunoId, alunoNome, turmaDescricao, totalMensalidades } = item
                    const expandido = expandidoRowKey === key
                    const parcelasState = parcelasPorRow[key]
                    const loadingParcelasEste = loadingParcelas === key
                    const parcelasLista = parcelasState?.data?.content ?? []
                    return (
                      <Fragment key={key}>
                        <tr>
                          <td>
                            <button
                              type="button"
                              className="turma-expand-btn"
                              onClick={() => aoExpandirRow(item)}
                              aria-expanded={expandido}
                            >
                              {expandido ? '−' : '+'}
                            </button>
                          </td>
                          <td><strong>{alunoNome}</strong></td>
                          <td>{turmaDescricao ?? '—'}</td>
                          <td>{totalMensalidades} {t('financeiro.installments')}</td>
                          <td className="actions-cell"></td>
                        </tr>
                        {expandido && (
                          <tr key={`${key}-detalhe`} className="turma-alunos-row">
                            <td colSpan={5}>
                              <div className="turma-alunos-wrap financeiro-mensalidades">
                                {loadingParcelasEste ? (
                                  <p>{t('financeiro.loadingParcelas')}</p>
                                ) : (
                                  <>
                                    <div className="table-responsive">
                                    <table className="table-inner">
                                      <thead>
                                        <tr>
                                          <th>{t('financeiro.ref')}</th>
                                          <th>{t('financeiro.dueDate')}</th>
                                          <th>{t('financeiro.value')}</th>
                                          <th>{t('financeiro.status')}</th>
                                          <th>{t('financeiro.payment')}</th>
                                          <th>{t('financeiro.paymentMethod')}</th>
                                          <th className="actions-cell">{t('common.actions')}</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {parcelasLista.map((m, idx) => {
                                          const ehPrimeiraParcelaGlobal = parcelasState.pageIndex === 0 && idx === 0
                                          const labelRef = ehPrimeiraParcelaGlobal ? t('financeiro.enrollment') : null
                                          const matriculaAtiva = alunosComMatriculaAtiva.has(m.alunoId)
                                          return (
                                            <tr key={m.id} className={labelRef ? 'row-matricula' : undefined}>
                                              <td>
                                                {labelRef ? (
                                                  <span className="ref-matricula">{labelRef} ({m.mes}/{m.ano})</span>
                                                ) : (
                                                  `${m.mes}/${m.ano}`
                                                )}
                                              </td>
                                              <td>{labelRef ? '—' : formatarDataLocal(m.vencimento)}</td>
                                              <td
                                                className={m.status === 'ATRASADO' && ((m.valorMulta ?? 0) > 0 || (m.valorJuros ?? 0) > 0) ? 'celula-valor-clicavel' : undefined}
                                                onClick={() => m.status === 'ATRASADO' && ((m.valorMulta ?? 0) > 0 || (m.valorJuros ?? 0) > 0) && setModalCalculoParcela(m)}
                                                role={m.status === 'ATRASADO' && ((m.valorMulta ?? 0) > 0 || (m.valorJuros ?? 0) > 0) ? 'button' : undefined}
                                                tabIndex={m.status === 'ATRASADO' && ((m.valorMulta ?? 0) > 0 || (m.valorJuros ?? 0) > 0) ? 0 : undefined}
                                                onKeyDown={(e) => m.status === 'ATRASADO' && ((m.valorMulta ?? 0) > 0 || (m.valorJuros ?? 0) > 0) && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setModalCalculoParcela(m))}
                                              >
                                                {m.status === 'ATRASADO' && ((m.valorMulta ?? 0) > 0 || (m.valorJuros ?? 0) > 0)
                                                  ? `${formatarMoeda(m.valor)} (${t('financeiro.total')}: ${formatarMoeda((m.valor ?? 0) + (m.valorMulta ?? 0) + (m.valorJuros ?? 0))})`
                                                  : formatarMoeda(m.valor)}
                                                {m.status === 'ATRASADO' && ((m.valorMulta ?? 0) > 0 || (m.valorJuros ?? 0) > 0) && (
                                                  <span className="celula-valor-ver-calculo" aria-hidden> — {t('financeiro.clickToSeeCalculation')}</span>
                                                )}
                                              </td>
                                              <td>{statusBadge(m.status, matriculaAtiva)}</td>
                                              <td>{formatarDataLocal(m.dataPagamento) || '—'}</td>
                                              <td>{m.formaPagamento?.trim() || '—'}</td>
                                              <td className="actions-cell">
                                                {matriculaAtiva && m.status !== 'PAGO' && (
                                                  <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => abrirBaixa(m, item)}
                                                  >
                                                    {t('financeiro.markPaid')}
                                                  </button>
                                                )}
                                                {m.status === 'PAGO' && (
                                                  <button
                                                    type="button"
                                                    className="btn btn-outline btn-sm"
                                                    onClick={() => reimprimirRecibo(m, item)}
                                                    disabled={reimprimindoId === m.id}
                                                  >
                                                    {reimprimindoId === m.id ? '...' : t('financeiro.reprintReceipt')}
                                                  </button>
                                                )}
                                              </td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                    </div>
                                    {parcelasState && parcelasState.data.totalPages > 0 && (
                                      <div className="paginacao-parcelas">
                                        <Paginacao
                                          page={parcelasState.pageIndex}
                                          totalPages={parcelasState.data.totalPages}
                                          totalElements={parcelasState.data.totalElements}
                                          size={parcelasState.size}
                                          onPageChange={(p) => setParcelasPage(key, item.matriculaId ?? null, item.alunoId, p)}
                                          onSizeChange={(s) => setParcelasSize(key, item.matriculaId ?? null, item.alunoId, s)}
                                        />
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
              </div>
              </div>
              {pageAlunos && pageAlunos.totalPages > 0 && (
                <Paginacao
                  page={pageAlunos.number}
                  totalPages={pageAlunos.totalPages}
                  totalElements={pageAlunos.totalElements}
                  size={pageAlunos.size}
                  onPageChange={setAlunoPageIndex}
                  onSizeChange={(s) => { setAlunoSize(s); setAlunoPageIndex(0); }}
                />
              )}
            </>
          )}
        </div>
      )}
      {modalAberto && (
        <ModalMensalidade onFechar={fecharModal} onSalvo={fecharModal} />
      )}
      {modalBaixaAberto && mensalidadeBaixa && (
        <ModalBaixa mensalidade={mensalidadeBaixa} turmaDescricao={itemBaixaAtual?.turmaDescricao ?? undefined} turmaDiasHorarios={itemBaixaAtual?.turmaDiasHorarios ?? undefined} onFechar={fecharBaixa} onSalvo={fecharBaixa} />
      )}
      {modalCalculoParcela && (() => {
        const valorBase = modalCalculoParcela.valor ?? 0
        const multa = modalCalculoParcela.valorMulta ?? 0
        const dias = diasEmAtraso(modalCalculoParcela.vencimento)
        const juros = jurosCalculado(valorBase, dias)
        const total = valorBase + multa + juros
        return (
          <div className="modal-overlay" onClick={() => setModalCalculoParcela(null)} role="dialog" aria-modal="true" aria-labelledby="modal-calculo-titulo">
            <div className="modal modal-calculo-parcela" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 id="modal-calculo-titulo">{t('financeiro.calculationTitle')}</h2>
              </div>
              <div className="modal-body">
                <div className="modal-calculo-conteudo">
                  <p><strong>{t('financeiro.ref')}</strong> {modalCalculoParcela.mes}/{modalCalculoParcela.ano}</p>
                  <p><strong>{t('financeiro.installmentValue')}:</strong> {formatarMoeda(valorBase)}</p>
                  <p><strong>{t('financeiro.penalty')} (10%):</strong> {formatarMoeda(multa)}</p>
                  <p><strong>{t('financeiro.daysOverdue')}:</strong> {dias} dia(s)</p>
                  <p><strong>{t('financeiro.interest')} (1% ao dia):</strong> {formatarMoeda(juros)}</p>
                  <p className="modal-calculo-total"><strong>{t('financeiro.totalToPay')}:</strong> {formatarMoeda(total)}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => setModalCalculoParcela(null)}>{t('common.close')}</button>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}
