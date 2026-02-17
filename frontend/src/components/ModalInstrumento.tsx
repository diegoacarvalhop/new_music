import { useState, useEffect, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import SelectSearch from './SelectSearch'
import type { Instrumento } from '../types'

interface ModalInstrumentoProps {
  instrumento: Instrumento | null
  onFechar: () => void
  onSalvo: () => void
}

export default function ModalInstrumento({ instrumento, onFechar, onSalvo }: ModalInstrumentoProps) {
  const { t } = useTranslation()
  const [nome, setNome] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [showFieldErrors, setShowFieldErrors] = useState(false)

  const isEdit = !!instrumento?.id

  useEffect(() => {
    if (instrumento) {
      setNome(instrumento.nome || '')
      setGrupoId(instrumento.grupoId ? String(instrumento.grupoId) : '')
      setDescricao(instrumento.descricao || '')
      setAtivo(instrumento.ativo !== false)
    } else {
      setGrupoId('')
    }
  }, [instrumento])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setShowFieldErrors(false)
    const nomeVazio = !nome.trim()
    const grupoVazio = !grupoId
    const descricaoVazia = !descricao.trim()
    const temErro = nomeVazio || grupoVazio || descricaoVazia
    if (temErro) {
      setErro('Preencha os campos obrigatórios.')
      setShowFieldErrors(true)
      return
    }
    setLoading(true)
    const payload = {
      nome,
      grupoId: Number(grupoId),
      descricao: descricao.trim() || undefined,
      ativo
    }
    const api = getApiClient()
    const req = isEdit ? api.put(`/instrumentos/${instrumento!.id}`, payload) : api.post('/instrumentos', payload)
    req
      .then(() => onSalvo())
      .catch((err) => setErro((err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem || 'Erro ao salvar.'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? t('instrumentos.editInstrument') : t('instrumentos.newInstrumentTitle')}</h2>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {erro && <div className="alert alert-error">{erro}</div>}
          <div className={`form-group ${showFieldErrors && !grupoId ? 'field-error' : ''}`}>
            <label>Grupo *</label>
            <SelectSearch
              value={grupoId}
              onChange={(val) => setGrupoId(val)}
              searchUrl="/grupos"
              placeholder="Selecione o grupo"
              emptyOption={{ value: '', label: 'Selecione o grupo' }}
              required
            />
          </div>
          <div className={`form-group ${showFieldErrors && !nome.trim() ? 'field-error' : ''}`}>
            <label>Nome *</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className={`form-group ${showFieldErrors && !descricao.trim() ? 'field-error' : ''}`}>
            <label>Descrição *</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} required />
          </div>
          <div className="form-group form-group-status">
            <div className="status-ativo">
              <input
                type="checkbox"
                id="instrumento-ativo"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="status-checkbox"
              />
              <label htmlFor="instrumento-ativo" className="status-label">
                Instrumento ativo (aparece nas listas e pode ser vinculado a turmas)
              </label>
            </div>
            <p className="form-hint">Desmarque para marcar o instrumento como inativo.</p>
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
