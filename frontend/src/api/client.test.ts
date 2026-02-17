import { describe, it, expect, beforeEach } from 'vitest'
import { setApiGetAuth, getApiClient } from './client'

describe('api client', () => {
  beforeEach(() => {
    setApiGetAuth(() => ({
      accessToken: null,
      refreshToken: null,
    }))
  })

  it('getApiClient retorna instância axios', () => {
    const client = getApiClient()
    expect(client).toBeDefined()
    expect(typeof client.get).toBe('function')
    expect(typeof client.post).toBe('function')
  })

  it('setApiGetAuth invalida cliente (nova instância na próxima getApiClient)', () => {
    const c1 = getApiClient()
    setApiGetAuth(() => ({ accessToken: null, refreshToken: null }))
    const c2 = getApiClient()
    expect(c1).not.toBe(c2)
    setApiGetAuth(() => ({ accessToken: 'x', refreshToken: 'y' }))
    const c3 = getApiClient()
    expect(c3).toBeDefined()
  })
})
