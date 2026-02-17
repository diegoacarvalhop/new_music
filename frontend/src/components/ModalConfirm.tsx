import type { ReactNode } from 'react'

interface ModalConfirmProps {
  titulo: string
  mensagem: ReactNode
  confirmarTexto?: string
  cancelarTexto?: string
  perigo?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export default function ModalConfirm({
  titulo,
  mensagem,
  confirmarTexto = 'Confirmar',
  cancelarTexto = 'Cancelar',
  perigo = false,
  onConfirmar,
  onCancelar
}: ModalConfirmProps) {
  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal modal-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{titulo}</h2>
        </div>
        <div className="modal-body">
          {mensagem}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onCancelar}>
            {cancelarTexto}
          </button>
          <button
            type="button"
            className={perigo ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirmar}
          >
            {confirmarTexto}
          </button>
        </div>
      </div>
    </div>
  )
}
