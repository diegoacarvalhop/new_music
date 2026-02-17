import { useState, useEffect, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import SelectSearch from './SelectSearch'

interface ModalMensalidadeProps {
  onFechar: () => void
  onSalvo: () => void
}

export default function ModalMensalidade({ onFechar, onSalvo }: ModalMensalidadeProps) {
  const { t } = useTranslation()
  const [ano, setAno] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [alunoId, setAlunoId] = useState<string>('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [showFieldErrors, setShowFieldErrors] = useState(false)

  useEffect(() => {
    const d = new Date(ano, mes - 1, 10)
    setVencimento(d.toISOString().slice(0, 10))
  }, [ano, mes])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setShowFieldErrors(false)
    const alunoVazio = !alunoId
    const valorVazio = !valor.trim()
    const vencimentoVazio = !vencimento.trim()
    const temErro = alunoVazio || valorVazio || vencimentoVazio
    if (temErro) {
      setErro('Preencha os campos obrigatórios.')
      setShowFieldErrors(true)
      return
    }
    setLoading(true)
    const payload = {
      ano: Number(ano),
      mes: Number(mes),
      valor: Number(valor.replace(',', '.')) || 0,
      vencimento,
      alunoId: Number(alunoId) || 0
    }
    getApiClient().post('/mensalidades', payload)
      .then(() => onSalvo())
      .catch((err) => setErro((err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem || 'Erro ao salvar.'))
      .finally(() => setLoading(false))
  }

  const MESES_OPCOES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => ({ value: String(m), label: String(m) }))

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nova mensalidade</h2>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {erro && <div className="alert alert-error">{erro}</div>}
          <div className={`form-group ${showFieldErrors && !alunoId ? 'field-error' : ''}`}>
            <label>Aluno *</label>
            <SelectSearch
              value={alunoId}
              onChange={(val) => setAlunoId(val)}
              searchUrl="/alunos"
              placeholder="Selecione o aluno"
              emptyOption={{ value: '', label: 'Selecione' }}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Ano *</label>
              <input type="number" min={2020} max={2030} value={ano} onChange={(e) => setAno(Number(e.target.value))} required />
            </div>
            <div className="form-group">
              <label>Mês *</label>
              <SelectSearch
                value={String(mes)}
                onChange={(val) => setMes(Number(val) || 1)}
                options={MESES_OPCOES}
                placeholder="Mês"
                required
                aria-label="Mês"
                className="select-search-wrap--compact"
              />
            </div>
          </div>
          <div className="form-row">
            <div className={`form-group ${showFieldErrors && !valor.trim() ? 'field-error' : ''}`}>
              <label>Valor *</label>
              <input type="text" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" required />
            </div>
            <div className={`form-group ${showFieldErrors && !vencimento.trim() ? 'field-error' : ''}`}>
              <label>Vencimento *</label>
              <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} placeholder="DD/MM/AAAA" required />
            </div>
          </div>
        </form>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onFechar}>{t('common.cancel')}</button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
