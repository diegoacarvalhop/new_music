import SelectSearch from './SelectSearch'

interface PaginacaoProps {
  page: number
  totalPages: number
  totalElements: number
  size: number
  onPageChange: (page: number) => void
  onSizeChange: (size: number) => void
  inicioFim?: { inicio: number; fim: number }
}

const OPCOES_TAMANHO = [10, 20, 30].map((n) => ({ value: String(n), label: String(n) }))

export default function Paginacao({ page, totalPages, totalElements, size, onPageChange, onSizeChange, inicioFim }: PaginacaoProps) {
  const inicio = inicioFim ? inicioFim.inicio : (totalElements === 0 ? 0 : page * size + 1)
  const fim = inicioFim ? inicioFim.fim : Math.min((page + 1) * size, totalElements)

  return (
    <div className="paginacao">
      <div className="paginacao-info">
        Exibindo {inicio} a {fim} de {totalElements} registro(s)
      </div>
      <div className="paginacao-controles">
        <label className="paginacao-tamanho">
          Por página:
          <SelectSearch
            value={String(size)}
            onChange={(val) => onSizeChange(Number(val) || 10)}
            options={OPCOES_TAMANHO}
            placeholder="Por página"
            aria-label="Registros por página"
            className="select-search-wrap--compact"
          />
        </label>
        <div className="paginacao-botoes">
          {page > 0 && totalPages > 0 && (
            <button
              type="button"
              className="btn btn-outline btn-sm paginacao-btn-arrow"
              onClick={() => onPageChange(0)}
              title="Primeira página"
              aria-label="Primeira página"
            >
              |&lt;
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline btn-sm paginacao-btn-arrow"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0}
            title="Página anterior"
            aria-label="Página anterior"
          >
            &lt;&lt;
          </button>
          <span className="paginacao-pagina">
            Página {page + 1} de {totalPages || 1}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm paginacao-btn-arrow"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1 || totalPages === 0}
            title="Próxima página"
            aria-label="Próxima página"
          >
            &gt;&gt;
          </button>
          {page < totalPages - 1 && totalPages > 0 && (
            <button
              type="button"
              className="btn btn-outline btn-sm paginacao-btn-arrow"
              onClick={() => onPageChange(totalPages - 1)}
              title="Última página"
              aria-label="Última página"
            >
              &gt;|
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
