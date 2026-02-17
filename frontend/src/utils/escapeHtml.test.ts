import { describe, it, expect } from 'vitest'
import { escapeHtml } from './escapeHtml'

describe('escapeHtml', () => {
  it('escapa caracteres especiais', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;')
    expect(escapeHtml("'x'")).toBe('&#39;x&#39;')
  })
  it('retorna string vazia para entrada vazia', () => {
    expect(escapeHtml('')).toBe('')
  })
})
