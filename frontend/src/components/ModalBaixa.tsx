import { useState, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import SelectSearch from './SelectSearch'
import { FORMAS_DE_PAGAMENTO } from '../utils/formasPagamento'
import { obterCidadePorGeolocalizacao, abrirReciboParaImpressao } from '../utils/recibo'
import type { Mensalidade } from '../types'

interface ModalBaixaProps {
  mensalidade: Mensalidade
  turmaDescricao?: string
  turmaDiasHorarios?: string
  onFechar: () => void
  onSalvo: () => void
}

export default function ModalBaixa({ mensalidade, turmaDescricao, turmaDiasHorarios, onFechar, onSalvo }: ModalBaixaProps) {
  const { t } = useTranslation()
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 10))
  const [formaPagamento, setFormaPagamento] = useState('')
  const [formaPagamentoOutro, setFormaPagamentoOutro] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [baixaConcluida, setBaixaConcluida] = useState(false)
  const [gerandoRecibo, setGerandoRecibo] = useState(false)

  const valorFormaPagamento =
    formaPagamento === 'Outro' && formaPagamentoOutro.trim()
      ? `Outro (${formaPagamentoOutro.trim()})`
      : formaPagamento || undefined

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    getApiClient().patch(`/mensalidades/${mensalidade.id}/baixa`, {
      dataPagamento,
      formaPagamento: valorFormaPagamento
    })
      .then(() => setBaixaConcluida(true))
      .catch((err) => setErro((err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem || 'Erro ao dar baixa.'))
      .finally(() => setLoading(false))
  }

  function naoGerarRecibo() {
    onSalvo()
    onFechar()
  }

  async function simGerarRecibo() {
    setGerandoRecibo(true)
    const cidade = await obterCidadePorGeolocalizacao()
    const valorBase = mensalidade.valor ?? 0
    const multa = mensalidade.valorMulta ?? 0
    const juros = mensalidade.valorJuros ?? 0
    abrirReciboParaImpressao(
      {
        alunoNome: mensalidade.alunoNome ?? '',
        alunoCpf: mensalidade.alunoCpf,
        mes: mensalidade.mes,
        ano: mensalidade.ano,
        vencimento: mensalidade.vencimento ?? '',
        dataPagamento,
        formaPagamento: valorFormaPagamento ?? '',
        valor: valorBase,
        valorMulta: multa > 0 ? multa : undefined,
        valorJuros: juros > 0 ? juros : undefined,
        turmaDescricao,
        turmaDiasHorarios
      },
      cidade || 'Não informada'
    )
    setGerandoRecibo(false)
    onSalvo()
    onFechar()
  }

  if (baixaConcluida) {
    return (
      <div className="modal-overlay" onClick={naoGerarRecibo}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Baixa registrada</h2>
          </div>
          <div className="modal-body">
            <p>Deseja gerar o recibo?</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={naoGerarRecibo}>Não</button>
            <button type="button" className="btn btn-primary" onClick={simGerarRecibo} disabled={gerandoRecibo}>
              {gerandoRecibo ? 'Gerando...' : 'Sim'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Dar baixa no pagamento</h2>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {erro && <div className="alert alert-error">{erro}</div>}
          <p><strong>{mensalidade.alunoNome}</strong> — Ref. {mensalidade.mes}/{mensalidade.ano}</p>
          <div className="form-group">
            <label>Data do pagamento</label>
            <input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} placeholder="DD/MM/AAAA" required />
          </div>
          <div className="form-group">
            <label htmlFor="modal-baixa-forma-pagamento">Forma de pagamento</label>
            <SelectSearch
              id="modal-baixa-forma-pagamento"
              className="form-select"
              value={formaPagamento}
              onChange={(val) => {
                setFormaPagamento(val)
                if (val !== 'Outro') setFormaPagamentoOutro('')
              }}
              options={[{ value: '', label: 'Selecione' }, ...FORMAS_DE_PAGAMENTO.map((f) => ({ value: f, label: f }))]}
              placeholder="Selecione"
              portal
              aria-label="Forma de pagamento"
            />
          </div>
          {formaPagamento === 'Outro' && (
            <div className="form-group">
              <label htmlFor="modal-baixa-forma-outro">Especifique a forma de pagamento</label>
              <input
                id="modal-baixa-forma-outro"
                type="text"
                value={formaPagamentoOutro}
                onChange={(e) => setFormaPagamentoOutro(e.target.value)}
                placeholder="Ex: Vale-refeição, Crédito em loja..."
                aria-label="Especifique a forma de pagamento"
              />
            </div>
          )}
        </form>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onFechar}>{t('common.cancel')}</button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? t('common.saving') : t('common.confirmPayment')}
          </button>
        </div>
      </div>
    </div>
  )
}
