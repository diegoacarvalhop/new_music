import axios, { type AxiosInstance } from 'axios'

const baseURL = '/api'

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  updateTokens?: (at: string, rt: string) => void
  logout?: () => void
}

let apiGetAuth: (() => AuthState) | null = null

export function setApiGetAuth(getter: () => AuthState): void {
  apiGetAuth = getter
  apiClient = null
}

function createApiClient(): AxiosInstance {
  const client = axios.create({ baseURL })
  client.interceptors.request.use((config) => {
    const auth = apiGetAuth?.()
    if (auth?.accessToken) config.headers.Authorization = `Bearer ${auth.accessToken}`
    return config
  })
  client.interceptors.response.use(
    (res) => res,
    async (err: unknown) => {
      const axErr = err as { config?: { headers?: Record<string, string>; _retry?: boolean }; response?: { status?: number } }
      const original = axErr.config
      const auth = apiGetAuth?.()
      if (axErr.response?.status === 401 && original && !(original as { _retry?: boolean })._retry && auth?.refreshToken) {
        (original as { _retry?: boolean })._retry = true
        try {
          const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
            baseURL + '/auth/refresh',
            { refreshToken: auth.refreshToken }
          )
          auth.updateTokens?.(data.accessToken, data.refreshToken)
          if (original.headers) original.headers.Authorization = `Bearer ${data.accessToken}`
          return client(original)
        } catch {
          auth.logout?.()
          window.location.href = '/login'
        }
      }
      return Promise.reject(err)
    }
  )
  return client
}

let apiClient: AxiosInstance | null = null

export function getApiClient(): AxiosInstance {
  if (!apiClient) apiClient = createApiClient()
  return apiClient
}
