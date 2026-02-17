import { describe, it, expect } from 'vitest'
import {
  validarEmail,
  soNumeros,
  validarCPF,
  mascaraCPF,
  mascaraTelefone,
  aplicarMascaraCPF,
  aplicarMascaraTelefone,
  mascaraMonetaria,
  valorMonetarioParaNumero,
} from './validacao'

describe('validacao', () => {
  describe('validarEmail', () => {
    it('retorna false para null ou vazio', () => {
      expect(validarEmail(null)).toBe(false)
      expect(validarEmail('')).toBe(false)
      expect(validarEmail(undefined)).toBe(false)
    })
    it('retorna true para e-mail válido', () => {
      expect(validarEmail('a@b.co')).toBe(true)
      expect(validarEmail('user@test.com')).toBe(true)
    })
    it('retorna false para e-mail inválido', () => {
      expect(validarEmail('semarroba')).toBe(false)
      expect(validarEmail('@semlocal.com')).toBe(false)
      expect(validarEmail('semdominio@')).toBe(false)
    })
  })

  describe('soNumeros', () => {
    it('retorna string vazia para null/undefined', () => {
      expect(soNumeros(null)).toBe('')
      expect(soNumeros(undefined)).toBe('')
    })
    it('remove não-dígitos', () => {
      expect(soNumeros('123.456.789-00')).toBe('12345678900')
      expect(soNumeros('(11) 98765-4321')).toBe('11987654321')
    })
  })

  describe('validarCPF', () => {
    it('retorna false para CPF inválido (todos iguais)', () => {
      expect(validarCPF('111.111.111-11')).toBe(false)
    })
    it('retorna false para quantidade errada de dígitos', () => {
      expect(validarCPF('123')).toBe(false)
    })
    it('retorna true para CPF válido', () => {
      expect(validarCPF('529.982.247-25')).toBe(true)
      expect(validarCPF('52998224725')).toBe(true)
    })
  })

  describe('mascaraCPF', () => {
    it('formata corretamente', () => {
      expect(mascaraCPF('12345678901')).toBe('123.456.789-01')
      expect(mascaraCPF('123')).toBe('123')
      expect(mascaraCPF('123456')).toBe('123.456')
    })
  })

  describe('mascaraTelefone', () => {
    it('formata corretamente', () => {
      expect(mascaraTelefone('11987654321')).toBe('(11) 98765-4321')
      expect(mascaraTelefone('11')).toBe('(11')
    })
  })

  describe('aplicarMascaraCPF e aplicarMascaraTelefone', () => {
    it('aplicam a partir do evento target', () => {
      expect(aplicarMascaraCPF({ target: { value: '12345678901' } })).toBe('123.456.789-01')
      expect(aplicarMascaraTelefone({ target: { value: '11987654321' } })).toBe('(11) 98765-4321')
    })
  })

  describe('mascaraMonetaria', () => {
    it('formata como BRL', () => {
      expect(mascaraMonetaria('123456')).toBe('1.234,56')
      expect(mascaraMonetaria('')).toBe('')
      expect(mascaraMonetaria(null)).toBe('')
    })
  })

  describe('valorMonetarioParaNumero', () => {
    it('converte string monetária para número', () => {
      expect(valorMonetarioParaNumero('1.234,56')).toBe(1234.56)
      expect(valorMonetarioParaNumero(null)).toBeUndefined()
      expect(valorMonetarioParaNumero('')).toBeUndefined()
    })
  })
})
