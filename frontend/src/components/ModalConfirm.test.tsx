import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import ModalConfirm from './ModalConfirm'

describe('ModalConfirm', () => {
  it('renderiza título e mensagem', () => {
    const { container } = render(
      <ModalConfirm
        titulo="Excluir?"
        mensagem="Tem certeza?"
        onConfirmar={() => {}}
        onCancelar={() => {}}
      />
    )
    const wrap = within(container)
    expect(wrap.getByRole('heading', { name: 'Excluir?' })).toBeInTheDocument()
    expect(wrap.getByText('Tem certeza?')).toBeInTheDocument()
  })

  it('chama onConfirmar ao clicar em Confirmar', () => {
    const onConfirmar = vi.fn()
    const { container } = render(
      <ModalConfirm
        titulo="Título"
        mensagem="Msg"
        onConfirmar={onConfirmar}
        onCancelar={() => {}}
      />
    )
    fireEvent.click(within(container).getByRole('button', { name: 'Confirmar' }))
    expect(onConfirmar).toHaveBeenCalledTimes(1)
  })

  it('chama onCancelar ao clicar em Cancelar', () => {
    const onCancelar = vi.fn()
    const { container } = render(
      <ModalConfirm
        titulo="Título"
        mensagem="Msg"
        onConfirmar={() => {}}
        onCancelar={onCancelar}
      />
    )
    fireEvent.click(within(container).getByRole('button', { name: 'Cancelar' }))
    expect(onCancelar).toHaveBeenCalledTimes(1)
  })

  it('usa classe btn-danger quando perigo é true', () => {
    const { container } = render(
      <ModalConfirm
        titulo="Título"
        mensagem="Msg"
        perigo
        onConfirmar={() => {}}
        onCancelar={() => {}}
      />
    )
    const btn = within(container).getByRole('button', { name: 'Confirmar' })
    expect(btn).toHaveClass('btn-danger')
  })
})
