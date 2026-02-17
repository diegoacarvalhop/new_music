import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import RoleRoute from './RoleRoute'
import { AuthProvider } from '../context/AuthContext'

function TestLayout() {
  return (
    <AuthProvider>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<RoleRoute allowed={['ADMINISTRADOR']}><div>Admin only</div></RoleRoute>} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('RoleRoute', () => {
  it('redireciona para / quando perfil não está em allowed', () => {
    render(<TestLayout />)
    expect(screen.getByText('Home')).toBeInTheDocument()
  })
})
