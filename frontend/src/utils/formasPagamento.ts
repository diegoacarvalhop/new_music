export const FORMAS_DE_PAGAMENTO = [
  'PIX',
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência Bancária',
  'Boleto Bancário',
  'Depósito Bancário',
  'Cheque',
  'Carteira Digital',
  'Outro'
] as const

export type FormaPagamento = (typeof FORMAS_DE_PAGAMENTO)[number]
