import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import Paginacao from './Paginacao'

describe('Paginacao', () => {
  it('exibe texto de registros', () => {
    const { container } = render(
      <Paginacao
        page={0}
        totalPages={5}
        totalElements={50}
        size={10}
        onPageChange={() => {}}
        onSizeChange={() => {}}
      />
    )
    const wrap = within(container)
    expect(wrap.getByText(/Exibindo 1 a 10 de 50/)).toBeInTheDocument()
    expect(wrap.getByText(/Página 1 de 5/)).toBeInTheDocument()
  })

  it('chama onPageChange ao clicar em próxima página', () => {
    const onPageChange = vi.fn()
    const { container } = render(
      <Paginacao
        page={0}
        totalPages={3}
        totalElements={30}
        size={10}
        onPageChange={onPageChange}
        onSizeChange={() => {}}
      />
    )
    const nextBtn = within(container).getByTitle('Próxima página')
    fireEvent.click(nextBtn)
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('botão anterior desabilitado na primeira página', () => {
    const { container } = render(
      <Paginacao
        page={0}
        totalPages={2}
        totalElements={20}
        size={10}
        onPageChange={() => {}}
        onSizeChange={() => {}}
      />
    )
    const prevBtn = within(container).getByTitle('Página anterior')
    expect(prevBtn).toBeDisabled()
  })
})
