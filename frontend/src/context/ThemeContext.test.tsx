import { describe, it, expect } from 'vitest'
import { render, screen, act, within } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'

function TestConsumer() {
  const { theme, toggleTheme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button type="button" onClick={toggleTheme}>Toggle</button>
      <button type="button" onClick={() => setTheme('dark')}>Set dark</button>
      <button type="button" onClick={() => setTheme('light')}>Set light</button>
    </div>
  )
}

describe('ThemeContext', () => {
  it('fora do provider lança erro', () => {
    expect(() => render(<TestConsumer />)).toThrow('useTheme must be used within ThemeProvider')
  })

  it('provider fornece tema inicial e toggle altera', () => {
    const { container } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    const wrap = within(container)
    expect(wrap.getByTestId('theme').textContent).toMatch(/light|dark/)
    act(() => wrap.getByText('Toggle').click())
    expect(wrap.getByTestId('theme').textContent).toBeDefined()
  })

  it('setTheme altera o tema', () => {
    const { container } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )
    const wrap = within(container)
    act(() => wrap.getByRole('button', { name: 'Set dark' }).click())
    expect(wrap.getByTestId('theme').textContent).toBe('dark')
    act(() => wrap.getByRole('button', { name: 'Set light' }).click())
    expect(wrap.getByTestId('theme').textContent).toBe('light')
  })
})
