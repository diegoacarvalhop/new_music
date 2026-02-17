import { describe, it, expect } from 'vitest'
import { formatarDiasHorariosTurma } from './turma'
import type { Turma } from '../types'

describe('turma', () => {
  describe('formatarDiasHorariosTurma', () => {
    it('retorna em traço quando sem horários', () => {
      expect(formatarDiasHorariosTurma({ id: 1 } as Turma)).toBe('—')
    })
    it('formata com horarios', () => {
      const t: Turma = {
        id: 1,
        horarios: [
          { diaSemana: 1, horarioInicio: '09:00', horarioFim: '10:00' },
          { diaSemana: 3, horarioInicio: '14:00' },
        ],
      }
      const r = formatarDiasHorariosTurma(t)
      expect(r).toContain('Segunda')
      expect(r).toContain('Quarta')
      expect(r).toContain('09')
      expect(r).toContain('14')
    })
    it('usa diaSemana/horarioInicio quando horarios vazio', () => {
      const t: Turma = {
        id: 1,
        diaSemana: 2,
        horarioInicio: '10:00',
      }
      const r = formatarDiasHorariosTurma(t)
      expect(r).toContain('Terça')
      expect(r).toContain('10')
    })
  })
})
