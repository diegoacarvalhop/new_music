import type { Turma, HorarioSlot } from '../types'

const DIAS = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']

function formatarH(h: string | undefined): string {
  if (!h) return ''
  const s = String(h)
  return s.length <= 2 ? s + 'h' : s.slice(0, 5).replace(':', 'h')
}

export function formatarDiasHorariosTurma(t: Turma): string {
  const slots = t.horarios && t.horarios.length > 0
    ? t.horarios
    : (t.diaSemana != null && t.horarioInicio != null
      ? [{ diaSemana: t.diaSemana, horarioInicio: t.horarioInicio }]
      : [])
  if (slots.length === 0) return '—'
  return (slots as HorarioSlot[])
    .map((s) => {
      const ini = formatarH(s.horarioInicio)
      const fim = formatarH(s.horarioFim)
      const horario = fim ? `${ini} às ${fim}` : ini
      return `${DIAS[s.diaSemana] ?? s.diaSemana} ${horario}`.trim()
    })
    .join(', ')
}
