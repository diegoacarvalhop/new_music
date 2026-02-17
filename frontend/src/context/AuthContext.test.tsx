import { describe, it, expect } from 'vitest'
import { render, screen, act, within } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

function TestConsumer() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="user">{auth.user?.nome ?? 'null'}</span>
      <button type="button" onClick={() => auth.login({
        accessToken: 'at',
        refreshToken: 'rt',
        id: 1,
        email: 'u@t.com',
        nome: 'User',
        perfil: 'ADMINISTRADOR',
      })}>Login</button>
      <button type="button" onClick={auth.logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  it('fora do provider lança erro', () => {
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within AuthProvider')
  })

  it('provider fornece valor inicial não autenticado', () => {
    const { container } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    const wrap = within(container)
    expect(wrap.getByTestId('authenticated').textContent).toBe('false')
    expect(wrap.getByTestId('user').textContent).toBe('null')
  })

  it('login atualiza user e isAuthenticated', () => {
    const { container } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    const wrap = within(container)
    act(() => {
      wrap.getByRole('button', { name: 'Login' }).click()
    })
    expect(wrap.getByTestId('authenticated').textContent).toBe('true')
    expect(wrap.getByTestId('user').textContent).toBe('User')
  })

  it('logout limpa user', () => {
    const { container } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    const wrap = within(container)
    act(() => wrap.getByRole('button', { name: 'Login' }).click())
    act(() => wrap.getByRole('button', { name: 'Logout' }).click())
    expect(wrap.getByTestId('authenticated').textContent).toBe('false')
    expect(wrap.getByTestId('user').textContent).toBe('null')
  })
})
