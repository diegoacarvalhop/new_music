import { describe, it, expect } from 'vitest'
import { FORMAS_DE_PAGAMENTO } from './formasPagamento'

describe('formasPagamento', () => {
  it('contém opções esperadas', () => {
    expect(FORMAS_DE_PAGAMENTO).toContain('PIX')
    expect(FORMAS_DE_PAGAMENTO).toContain('Dinheiro')
    expect(FORMAS_DE_PAGAMENTO).toContain('Cartão de Crédito')
    expect(FORMAS_DE_PAGAMENTO.length).toBeGreaterThan(5)
  })
})
