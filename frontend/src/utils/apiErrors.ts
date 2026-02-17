/**
 * Resposta de erro da API (GlobalExceptionHandler).
 * - mensagem: texto geral
 * - erros: mapa campo -> mensagem (quando MethodArgumentNotValidException)
 */
export interface ApiErrorResponse {
  mensagem?: string
  erros?: Record<string, string>
}

export type AxiosErrorWithApi = {
  response?: {
    data?: ApiErrorResponse
    status?: number
  }
}

export function getApiErrors(err: unknown): { mensagem: string; erros: Record<string, string> } {
  const ax = err as AxiosErrorWithApi
  const data = ax?.response?.data as ApiErrorResponse | undefined
  const mensagem = data?.mensagem ?? 'Erro ao processar. Tente novamente.'
  const erros = data?.erros ?? {}
  return { mensagem, erros }
}

export function getFieldError(erros: Record<string, string>, field: string): string | undefined {
  return erros[field]
}
