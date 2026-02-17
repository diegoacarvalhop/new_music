import { useState, useEffect, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import { getApiErrors } from '../utils/apiErrors'
import type { Turma } from '../types'
import type { PresencaRegistro } from '../types'

function formatarData(d: string | Date | undefined): string {
  if (!d) return ''
  const x = typeof d === 'string' ? d : (d as Date).toISOString?.()?.slice(0, 10) ?? ''
  return x.slice(0, 10)
}

function hojeYYYYMMDD(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function diasAulaDaTurma(turma: Turma): number[] {
  if (turma.horarios?.length) {
    return turma.horarios.map((h) => h.diaSemana).filter((d) => d != null)
  }
  if (turma.diaSemana != null) {
    return [turma.diaSemana]
  }
  return []
}

function isDiaDeAula(turma: Turma, dataStr: string): boolean {
  const dias = diasAulaDaTurma(turma)
  if (dias.length === 0) return false
  const d = new Date(dataStr + 'T12:00:00')
  const diaSemana = d.getDay() === 0 ? 7 : d.getDay()
  return dias.includes(diaSemana)
}

interface ModalChamadaProps {
  turma: Turma | null
  onFechar: () => void
  onSalvo?: () => void
}

export default function ModalChamada({ turma, onFechar, onSalvo }: ModalChamadaProps) {
  const { t } = useTranslation()
  const [dataAula, setDataAula] = useState(() => hojeYYYYMMDD())
  const [registros, setRegistros] = useState<PresencaRegistro[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingLista, setLoadingLista] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!turma?.id || !dataAula) return
    setLoadingLista(true)
    setErro('')
    getApiClient()
      .get<PresencaRegistro[]>(`/turmas/${turma.id}/presencas`, { params: { data: dataAula } })
      .then((r) => setRegistros(r.data || []))
      .catch(() => {
        setRegistros([])
        setErro('Erro ao carregar lista de chamada.')
      })
      .finally(() => setLoadingLista(false))
  }, [turma?.id, dataAula])

  function togglePresente(matriculaId: number) {
    setRegistros((prev) =>
      prev.map((r) =>
        r.matriculaId === matriculaId ? { ...r, presente: !r.presente } : r
      )
    )
  }

  function setConteudoAula(matriculaId: number, value: string) {
    setRegistros((prev) =>
      prev.map((r) =>
        r.matriculaId === matriculaId ? { ...r, conteudoAula: value } : r
      )
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!turma?.id) return
    setErro('')
    setLoading(true)
    const payload = {
      dataAula,
      registros: registros.map((r) => ({
        matriculaId: r.matriculaId,
        presente: r.pagamentoEmDia !== false && r.presente !== false,
        conteudoAula: r.conteudoAula?.trim() || undefined
      }))
    }
    getApiClient()
      .post(`/turmas/${turma.id}/presencas`, payload)
      .then(() => onSalvo?.())
      .catch((err) => setErro(getApiErrors(err).mensagem))
      .finally(() => setLoading(false))
  }

  if (!turma) return null

  const hoje = hojeYYYYMMDD()
  const dataEhFutura = dataAula > hoje
  const dataEhDiaDeAula = !dataEhFutura && isDiaDeAula(turma, dataAula)

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal modal-chamada" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chamada — {turma.instrumentoNome}</h2>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {erro && <div className="alert alert-error">{erro}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Data da aula *</label>
              <input
                type="date"
                value={formatarData(dataAula)}
                onChange={(e) => setDataAula(e.target.value)}
                placeholder="DD/MM/AAAA"
                max={hojeYYYYMMDD()}
                required
              />
            </div>
          </div>
          {dataEhFutura ? (
            <p className="empty-state">Não é possível fazer chamada em data futura. Selecione uma data até hoje.</p>
          ) : !dataEhDiaDeAula ? (
            <p className="empty-state">Nenhuma aula desta turma nesta data (verifique o dia da semana).</p>
          ) : loadingLista ? (
            <p>Carregando alunos...</p>
          ) : registros.length === 0 ? (
            <p className="empty-state">Nenhum aluno matriculado nesta turma.</p>
          ) : (
            <div className="chamada-lista">
              <p className="form-hint">Marque presença ou falta para cada aluno. Alunos com pagamento em atraso não podem ter presença marcada — regularize no financeiro.</p>
              <ul>
                {registros.map((r) => {
                  const emDia = r.pagamentoEmDia !== false
                  const presente = emDia ? (r.presente !== false) : false
                  return (
                    <li key={r.matriculaId} className="chamada-item">
                      <div className="chamada-item-header">
                        <label>
                          <input
                            type="checkbox"
                            checked={presente}
                            onChange={() => emDia && togglePresente(r.matriculaId)}
                            disabled={!emDia}
                          />
                          <span className={presente ? '' : 'falta'}>
                            {r.alunoNome}
                          </span>
                          {!emDia && (
                            <span className="badge badge-danger" style={{ marginLeft: '0.5rem' }} title="Pagamento em atraso">
                              Atrasado
                            </span>
                          )}
                        </label>
                      </div>
                      <div className="form-group chamada-conteudo">
                        <label htmlFor={`conteudo-${r.matriculaId}`}>Conteúdo da aula</label>
                        <textarea
                          id={`conteudo-${r.matriculaId}`}
                          value={r.conteudoAula ?? ''}
                          onChange={(e) => setConteudoAula(r.matriculaId, e.target.value)}
                          placeholder="Descreva o conteúdo ministrado nesta aula para o aluno..."
                          rows={2}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </form>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onFechar}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || loadingLista || dataEhFutura || !dataEhDiaDeAula || registros.length === 0}
          >
            {loading ? t('common.saving') : t('common.saveAttendance')}
          </button>
        </div>
      </div>
    </div>
  )
}
