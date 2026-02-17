export function validarEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email.trim())
}

export function soNumeros(str: string | number | null | undefined): string {
  if (str == null) return ''
  return String(str).replace(/\D/g, '')
}

export function validarCPF(cpf: string | null | undefined): boolean {
  const nums = soNumeros(cpf)
  if (nums.length !== 11) return false
  if (/^(\d)\1{10}$/.test(nums)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(nums[i], 10) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  if (resto !== parseInt(nums[9], 10)) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(nums[i], 10) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  if (resto !== parseInt(nums[10], 10)) return false
  return true
}

export function mascaraCPF(value: string | number | null | undefined): string {
  const v = soNumeros(value).slice(0, 11)
  if (v.length <= 3) return v
  if (v.length <= 6) return `${v.slice(0, 3)}.${v.slice(3)}`
  if (v.length <= 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`
  return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`
}

export function mascaraTelefone(value: string | number | null | undefined): string {
  const v = soNumeros(value).slice(0, 11)
  if (v.length <= 2) return v.length ? `(${v}` : ''
  if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
}

export function aplicarMascaraCPF(e: { target: { value: string } }): string {
  return mascaraCPF(e.target.value)
}

export function aplicarMascaraTelefone(e: { target: { value: string } }): string {
  return mascaraTelefone(e.target.value)
}

/** Formata como moeda BRL: apenas dígitos e vírgula, ex: "1.234,56". Remove zeros à esquerda da parte inteira. */
export function mascaraMonetaria(value: string | number | null | undefined): string {
  if (value == null || value === '') return ''
  const s = String(value).replace(/\D/g, '')
  if (s.length === 0) return ''
  const centavos = s.slice(-2).padStart(2, '0')
  const inteirosRaw = s.slice(0, -2)
  const inteirosSemZeros = inteirosRaw.replace(/^0+/, '') || '0'
  const inteiros = inteirosSemZeros.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${inteiros},${centavos}`
}

export function valorMonetarioParaNumero(str: string | null | undefined): number | undefined {
  if (str == null || !str.trim()) return undefined
  const limpo = String(str).replace(/\./g, '').replace(',', '.')
  const n = parseFloat(limpo)
  return Number.isNaN(n) ? undefined : n
}
