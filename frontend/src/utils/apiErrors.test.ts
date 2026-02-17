import { describe, it, expect } from 'vitest'
import { getApiErrors, getFieldError } from './apiErrors'

describe('apiErrors', () => {
  describe('getApiErrors', () => {
    it('retorna mensagem padrão quando não há response', () => {
      const { mensagem, erros } = getApiErrors(new Error('network'))
      expect(mensagem).toBe('Erro ao processar. Tente novamente.')
      expect(erros).toEqual({})
    })
    it('extrai mensagem e erros da resposta da API', () => {
      const err = {
        response: {
          data: { mensagem: 'Dados inválidos', erros: { email: 'E-mail já existe' } },
          status: 400,
        },
      }
      const { mensagem, erros } = getApiErrors(err)
      expect(mensagem).toBe('Dados inválidos')
      expect(erros).toEqual({ email: 'E-mail já existe' })
    })
  })

  describe('getFieldError', () => {
    it('retorna mensagem do campo', () => {
      expect(getFieldError({ email: 'Inválido' }, 'email')).toBe('Inválido')
    })
    it('retorna undefined quando campo não existe', () => {
      expect(getFieldError({}, 'nome')).toBeUndefined()
    })
  })
})
