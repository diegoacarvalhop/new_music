import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getApiClient } from '../api/client'
import SelectSearch from '../components/SelectSearch'
import {
  type TipoDeclaracao,
  abrirDeclaracaoParaImpressao,
  menorDeIdade,
  computeDeclaracaoState
} from '../utils/declaracoes'
import type { Aluno } from '../types'

type AlunosRes = { content: Aluno[] }

export default function Declaracoes() {
  const { t } = useTranslation()
  const [tipo, setTipo] = useState<TipoDeclaracao>('LGPD')
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [alunoId, setAlunoId] = useState<string>('')
  const [alunoQuery, setAlunoQuery] = useState('')
  const [alunoDropdownOpen, setAlunoDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    setLoading(true)
    getApiClient()
      .get<AlunosRes>('/alunos', { params: { page: 0, size: 500 } })
      .then((r) => setAlunos(r.data?.content ?? []))
      .catch(() => setErro('Erro ao carregar alunos.'))
      .finally(() => setLoading(false))
  }, [])

  const alunosParaLista = useMemo(() => {
    const q = alunoQuery.trim().toLowerCase()
    if (!q) return alunos
    return alunos.filter((a) => (a.nome ?? '').toLowerCase().includes(q))
  }, [alunos, alunoQuery])

  const state = useMemo(() => computeDeclaracaoState(alunoId, alunos, tipo), [alunoId, alunos, tipo])

  const tiposDeclaracao: { value: TipoDeclaracao; labelKey: string }[] = [
    { value: 'LGPD', labelKey: 'declaracoes.lgpd' },
    { value: 'DIRETO_IMAGEM', labelKey: 'declaracoes.imageRights' },
    { value: 'DECLARACAO_RESPONSAVEL', labelKey: 'declaracoes.responsibility' },
  ]

  const handleImprimir = () => {
    if (!state.aluno || !state.dados) return
    abrirDeclaracaoParaImpressao(tipo, state.dados)
  }

  return (
    <>
      <div className="page-header">
        <h1>{t('declaracoes.title')}</h1>
      </div>
      {erro && <div className="alert alert-error">{erro}</div>}
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <div className="card">
          <div className="form-group">
            <label htmlFor="declaracao-tipo">{t('declaracoes.type')}</label>
            <SelectSearch
              id="declaracao-tipo"
              value={tipo}
              onChange={(val) => setTipo(val as TipoDeclaracao)}
              options={tiposDeclaracao.map((item) => ({ value: item.value, label: t(item.labelKey) }))}
              placeholder={t('declaracoes.type')}
              aria-label={t('declaracoes.type')}
              className="select-search-wrap--compact"
            />
          </div>
          <div className="form-group">
            <label htmlFor="declaracao-aluno">{t('declaracoes.student')}</label>
            <div className="select-search-wrap">
              <input
                id="declaracao-aluno"
                type="text"
                className="select-search-input"
                placeholder={t('declaracoes.searchPlaceholder')}
                value={alunoDropdownOpen ? alunoQuery : (alunos.find((a) => a.id === Number(alunoId))?.nome ?? '')}
                onChange={(e) => {
                  setAlunoQuery(e.target.value)
                  setAlunoDropdownOpen(true)
                }}
                onFocus={() => setAlunoDropdownOpen(true)}
                onBlur={() => setTimeout(() => setAlunoDropdownOpen(false), 200)}
                autoComplete="off"
                aria-label={t('common.search')}
              />
              {alunoDropdownOpen && (
                <ul className="select-search-dropdown" role="listbox">
                  {alunosParaLista.length === 0 ? (
                    <li className="select-search-dropdown-empty">{t('declaracoes.noStudentsFound')}</li>
                  ) : (
                    alunosParaLista.map((a) => (
                      <li
                        key={a.id}
                        role="option"
                        className="select-search-dropdown-item"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setAlunoId(String(a.id))
                          setAlunoQuery('')
                          setAlunoDropdownOpen(false)
                        }}
                      >
                        {a.nome}
                        {a.dataNascimento && menorDeIdade(a.dataNascimento) ? ' (menor)' : ''}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
          {state.aluno && (
            <>
              <div className="form-group">
                <label>{t('declaracoes.preview')}</label>
                <div
                  className="declaracao-preview"
                  style={{
                    whiteSpace: 'pre-wrap',
                    textAlign: 'justify',
                    padding: '1rem',
                    background: 'var(--bg-secondary, #f5f5f5)',
                    borderRadius: 4,
                    maxHeight: 300,
                    overflow: 'auto'
                  }}
                >
                  {state.textoPreview}
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleImprimir}
                >
                  {t('declaracoes.print')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
