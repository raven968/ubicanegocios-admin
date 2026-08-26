import { useId, useState } from 'react'
import type { Paginated } from '../lib/types'

interface Props {
  meta: Paginated<unknown>['meta']
  onPageChange: (page: number) => void
}

export default function Pagination({ meta, onPageChange }: Props) {
  const [jump, setJump] = useState('')
  const jumpId = useId()

  if (!meta || meta.last_page <= 1) return null

  const { current_page, last_page, from, to, total } = meta

  /** Salta a la página escrita; ignora vacíos, decimales y fuera de rango. */
  const go = () => {
    const page = Number(jump)
    setJump('')
    if (!jump.trim() || !Number.isInteger(page) || page < 1 || page > last_page) return
    if (page !== current_page) onPageChange(page)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 text-sm">
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

        <label htmlFor={jumpId} className="ml-2 text-gray-500">
          Ir a
        </label>
        <input
          id={jumpId}
          type="number"
          min={1}
          max={last_page}
          value={jump}
          onChange={(e) => setJump(e.target.value)}
          onBlur={go}
          // El paginador puede vivir dentro de otro form (ficha del negocio),
          // así que Enter no debe enviarlo.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              go()
            }
          }}
          placeholder={String(current_page)}
          aria-label={`Ir a la página, de 1 a ${last_page}`}
          className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-center focus:border-emerald-500 focus:outline-none"
        />
      </div>
    </div>
  )
}
