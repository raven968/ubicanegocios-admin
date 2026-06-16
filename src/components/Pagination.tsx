import type { Paginated } from '../lib/types'

interface Props {
  meta: Paginated<unknown>['meta']
  onPageChange: (page: number) => void
}

export default function Pagination({ meta, onPageChange }: Props) {
  if (!meta || meta.last_page <= 1) return null

  const { current_page, last_page, from, to, total } = meta

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 text-sm">
      <p className="text-gray-500">
        Mostrando <span className="font-medium text-gray-700">{from ?? 0}</span>–
        <span className="font-medium text-gray-700">{to ?? 0}</span> de{' '}
        <span className="font-medium text-gray-700">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page <= 1}
          className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-gray-500">
          Página {current_page} de {last_page}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page >= last_page}
          className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
