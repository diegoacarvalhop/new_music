import { describe, it, expect } from 'vitest'
import { formatarDataPorExtenso } from './recibo'

describe('recibo', () => {
  describe('formatarDataPorExtenso', () => {
    it('formata data por extenso em pt-BR', () => {
      const d = new Date(2025, 1, 17)
      const r = formatarDataPorExtenso(d)
      expect(r).toContain('17')
      expect(r).toMatch(/fevereiro|Fevereiro/)
      expect(r).toContain('2025')
    })
    it('usa data atual quando não passado argumento', () => {
      const r = formatarDataPorExtenso()
      expect(r.length).toBeGreaterThan(5)
      expect(r).toMatch(/\d{2} de \w+ de \d{4}/)
    })
  })
})
