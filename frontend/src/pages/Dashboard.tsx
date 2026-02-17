import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'

interface Stats {
  alunos: number
  professores: number
  turmas: number
  alunosComPagamentoAtrasado: number
  aulasHoje: number
}

export default function Dashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stats>({ alunos: 0, professores: 0, turmas: 0, alunosComPagamentoAtrasado: 0, aulasHoje: 0 })
  const [aulasHojeModalAberto, setAulasHojeModalAberto] = useState(false)
  const [aulasHojeDetalhe, setAulasHojeDetalhe] = useState<{ dia: string; instrumento: string; professor: string; horarioInicio: string; horarioFim: string }[]>([])
  const [aulasHojeCarregando, setAulasHojeCarregando] = useState(false)
  const [aulasHojeErro, setAulasHojeErro] = useState('')

  useEffect(() => {
    getApiClient()
      .get<{ alunos: number; professores: number; turmas: number; matriculasAtivas: number; alunosComPagamentoAtrasado: number; aulasHoje: number }>(
        '/relatorios/consolidado/dashboard'
      )
      .then((r) => {
        const data = r.data || ({} as any)
        setStats({
          alunos: data.alunos ?? 0,
          professores: data.professores ?? 0,
          turmas: data.turmas ?? 0,
          alunosComPagamentoAtrasado: data.alunosComPagamentoAtrasado ?? 0,
          aulasHoje: data.aulasHoje ?? 0
        })
      })
      .catch(() => {})
  }, [])

  const cardsAdmin = [
    { label: t('dashboard.statsAlunos'), value: stats.alunos, path: '/alunos', color: 'primary' as const },
    { label: t('dashboard.statsProfessores'), value: stats.professores, path: '/professores', color: 'secondary' as const },
    { label: t('dashboard.statsTurmas'), value: stats.turmas, path: '/turmas', color: 'accent' as const },
    { label: t('dashboard.statsAlunosAtraso'), value: stats.alunosComPagamentoAtrasado, path: '/financeiro', color: 'warning' as const },
    { label: t('dashboard.statsAulasHoje'), value: stats.aulasHoje, path: '/turmas', color: 'secondary' as const, onClick: () => abrirAulasHoje() }
  ]
  const cards = cardsAdmin

  function abrirAulasHoje() {
    setAulasHojeErro('')
    setAulasHojeCarregando(true)
    setAulasHojeModalAberto(true)
    getApiClient()
      .get<{ dia: string; instrumento: string; professor: string; horarioInicio: string; horarioFim: string }[]>('/relatorios/consolidado/aulas-hoje')
      .then((r) => {
        setAulasHojeDetalhe(r.data ?? [])
      })
      .catch(() => {
        setAulasHojeErro(t('common.errorLoading'))
        setAulasHojeDetalhe([])
      })
      .finally(() => setAulasHojeCarregando(false))
  }

  return (
    <>
      <div className="card dashboard-welcome-card dashboard-welcome-card--top">
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', color: 'var(--secondary)' }}>{t('dashboard.welcomePanel')}</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          {t('dashboard.useMenu')}
        </p>
      </div>
      <div className="page-header">
        <h1>{t('nav.home')}</h1>
      </div>
      <div className="dashboard-cards">
        {cards.map(({ label, value, path, color, onClick }) => (
          <Link
            key={label}
            to={path}
            className={`dashboard-card dashboard-card--${color}`}
            onClick={onClick ? (e) => { e.preventDefault(); onClick(); } : undefined}
          >
            <span className="dashboard-card-value">{value}</span>
            <span className="dashboard-card-label">{label}</span>
          </Link>
        ))}
      </div>
      {aulasHojeModalAberto && (
        <div className="modal-overlay" onClick={() => setAulasHojeModalAberto(false)}>
          <div className="modal modal-aulas-hoje" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('dashboard.statsAulasHoje')}</h2>
            </div>
            <div className="modal-body">
              {aulasHojeErro && <div className="alert alert-error">{aulasHojeErro}</div>}
              {aulasHojeCarregando ? (
                <p>{t('common.loading')}</p>
              ) : aulasHojeDetalhe.length === 0 ? (
                <p className="form-hint">Nenhuma aula cadastrada para hoje.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Instrumento</th>
                      <th>Professor</th>
                      <th>Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aulasHojeDetalhe.map((linha, idx) => (
                      <tr key={idx}>
                        <td>{linha.instrumento}</td>
                        <td>{linha.professor}</td>
                        <td>
                          {linha.horarioInicio
                            ? `${linha.horarioInicio.substring(0, 5)}${linha.horarioFim ? ` - ${linha.horarioFim.substring(0, 5)}` : ''}`
                            : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setAulasHojeModalAberto(false)}>
                {t('common.close') ?? 'Fechar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
