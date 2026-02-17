import { describe, it, expect } from 'vitest'
import { formatarDataLocal, formatarDataHoraLocal, calcularDataFimCurso } from './date'

describe('date', () => {
  describe('formatarDataLocal', () => {
    it('retorna em traço para vazio ou inválido', () => {
      expect(formatarDataLocal('')).toBe('—')
      expect(formatarDataLocal(undefined)).toBe('—')
    })
    it('formata ISO para pt-BR', () => {
      expect(formatarDataLocal('2025-02-17')).toBe('17/02/2025')
    })
  })

  describe('formatarDataHoraLocal', () => {
    it('retorna em traço para vazio', () => {
      expect(formatarDataHoraLocal('')).toBe('—')
    })
    it('formata data/hora para pt-BR', () => {
      const r = formatarDataHoraLocal('2025-02-17 14:30:00')
      expect(r).toMatch(/\d{2}\/\d{2}\/\d{4}/)
      expect(r).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('calcularDataFimCurso', () => {
    it('retorna vazio para data inválida', () => {
      expect(calcularDataFimCurso('', 1)).toBe('')
      expect(calcularDataFimCurso('invalido', 1)).toBe('')
    })
    it('Canto 2 aulas/semana = 3 meses', () => {
      const r = calcularDataFimCurso('2025-01-01', 2, true)
      expect(r).toBe('2025-04-01')
    })
    it('Canto 1 aula/semana = 6 meses', () => {
      const r = calcularDataFimCurso('2025-01-01', 1, true)
      expect(r).toBe('2025-07-01')
    })
    it('Outros 2 aulas/semana = 12 meses', () => {
      const r = calcularDataFimCurso('2025-01-01', 2, false)
      expect(r).toBe('2026-01-01')
    })
    it('Outros 1 aula/semana = 24 meses', () => {
      const r = calcularDataFimCurso('2025-01-01', 1, false)
      expect(r).toBe('2027-01-01')
    })
  })
})
