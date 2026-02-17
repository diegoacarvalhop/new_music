export function formatarDataLocal(d: string | undefined): string {
  if (!d || typeof d !== 'string') return '—'
  const part = d.trim().slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
    const [y, m, day] = part.split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleDateString('pt-BR')
  }
  return new Date(d).toLocaleDateString('pt-BR')
}

export function formatarDataHoraLocal(d: string | undefined): string {
  if (!d || typeof d !== 'string') return '—'
  const date = new Date(d.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return d
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

/**
 * Calcula a data fim do curso.
 * Para instrumentos do grupo "Canto": 2 aulas/semana = 3 meses, 1 aula/semana = 6 meses.
 * Para os demais: 2 aulas/semana = 12 meses, 1 aula/semana = 24 meses.
 */
export function calcularDataFimCurso(
  dataInicio: string,
  aulasPorSemana: 1 | 2,
  isCanto?: boolean
): string {
  if (!dataInicio || !/^\d{4}-\d{2}-\d{2}$/.test(dataInicio.trim().slice(0, 10))) return ''
  const [y, m, day] = dataInicio.trim().slice(0, 10).split('-').map(Number)
  const d = new Date(y, m - 1, day)
  const meses =
    isCanto === true
      ? aulasPorSemana === 2
        ? 3
        : 6
      : aulasPorSemana === 2
        ? 12
        : 24
  d.setMonth(d.getMonth() + meses)
  const ye = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  return `${ye}-${mo}-${da}`
}
