import { useState, useEffect, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Professor } from '../types'
import type { PresencaProfessorRegistro } from '../types'

function formatarData(d: string | Date | undefined): string {
  if (!d) return ''
  const x = typeof d === 'string' ? d : (d as Date).toISOString?.()?.slice(0, 10) ?? ''
  return x.slice(0, 10)
}

function hojeYYYYMMDD(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface ModalChamadaProfessorProps {
  professor: Professor | null
  onFechar: () => void
  onSalvo?: () => void
}

export default function ModalChamadaProfessor({ professor, onFechar, onSalvo }: ModalChamadaProfessorProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isAdmin = user?.perfil === 'ADMINISTRADOR'
  const [dataAula, setDataAula] = useState(() => hojeYYYYMMDD())
  const [registros, setRegistros] = useState<PresencaProfessorRegistro[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingLista, setLoadingLista] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!professor?.id || !dataAula) return
    setLoadingLista(true)
    setErro('')
    getApiClient()
      .get<PresencaProfessorRegistro[]>(`/professores/${professor.id}/presencas`, { params: { data: dataAula } })
      .then((r) => setRegistros(r.data || []))
      .catch(() => {
        setRegistros([])
        setErro('Erro ao carregar lista de chamada.')
      })
      .finally(() => setLoadingLista(false))
  }, [professor?.id, dataAula])

  function togglePresente(turmaId: number) {
    setRegistros((prev) =>
      prev.map((r) =>
        r.turmaId === turmaId ? { ...r, presente: !r.presente } : r
      )
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!professor?.id) return
    setErro('')
    setLoading(true)
    const payload = {
      dataAula,
      registros: registros.map((r) => ({
        turmaId: r.turmaId,
        presente: r.presente !== false
      }))
    }
    getApiClient()
      .post(`/professores/${professor.id}/presencas`, payload)
      .then(() => onSalvo?.())
      .catch((err) => setErro((err as { response?: { data?: { mensagem?: string } } })?.response?.data?.mensagem || 'Erro ao salvar chamada.'))
      .finally(() => setLoading(false))
  }

  if (!professor) return null

  const hoje = hojeYYYYMMDD()
  const dataEhFutura = dataAula > hoje

  if (!isAdmin) {
    return (
      <div className="modal-overlay" onClick={onFechar}>
        <div className="modal modal-chamada" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Chamada do professor — {professor.nome}</h2>
          </div>
          <div className="modal-body">
            <p className="empty-state">Apenas o administrador pode realizar a chamada do professor.</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onFechar}>
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal modal-chamada" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chamada do professor — {professor.nome}</h2>
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
                max={hoje}
                required
              />
            </div>
          </div>
          {dataEhFutura ? (
            <p className="empty-state">Não é possível fazer chamada em data futura. Selecione uma data até hoje.</p>
          ) : loadingLista ? (
            <p>Carregando aulas do dia...</p>
          ) : registros.length === 0 ? (
            <p className="empty-state">Nenhuma aula deste professor nesta data (verifique o dia da semana).</p>
          ) : (
            <div className="chamada-lista">
              <p className="form-hint">Marque presença ou falta do professor em cada turma/aula.</p>
              <ul>
                {registros.map((r) => (
                  <li key={r.turmaId} className="chamada-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={r.presente !== false}
                        onChange={() => togglePresente(r.turmaId)}
                        disabled={!isAdmin}
                      />
                      <span className={r.presente === false ? 'falta' : ''}>
                        {r.turmaDescricao ?? `Turma ${r.turmaId}`}
                      </span>
                    </label>
                  </li>
                ))}
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
            disabled={loading || loadingLista || dataEhFutura || registros.length === 0}
          >
            {loading ? t('common.saving') : t('common.saveAttendance')}
          </button>
        </div>
      </div>
    </div>
  )
}
