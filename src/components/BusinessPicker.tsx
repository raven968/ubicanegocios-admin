import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import api from '../lib/api'
import type { Business, BusinessRef, Paginated } from '../lib/types'

interface Props {
  value: BusinessRef | null
  onChange: (business: BusinessRef | null) => void
  placeholder?: string
  autoFocus?: boolean
}

/** Buscador de clientes: reusa el listado de negocios del admin. */
export default function BusinessPicker({
  value,
  onChange,
  placeholder = 'Busca el cliente por nombre o folio…',
  autoFocus = false,
}: Props) {
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), 250)
    return () => clearTimeout(id)
  }, [term])

  // Cerrar el desplegable al hacer clic fuera.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const { data, isFetching } = useQuery({
    queryKey: ['businesses', 'picker', debounced],
    queryFn: async () =>
      (
        await api.get<Paginated<Business>>('/admin/businesses', {
          params: { search: debounced || undefined },
        })
      ).data.data,
    enabled: open,
  })

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
        <span className="font-medium text-emerald-900">{value.name}</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-emerald-700 hover:text-emerald-900"
          title="Cambiar cliente"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={box} className="relative">
      <div className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 focus-within:border-emerald-500">
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          autoFocus={autoFocus}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full text-sm focus:outline-none"
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {isFetching && <p className="px-3 py-2 text-sm text-gray-400">Buscando…</p>}
          {!isFetching && data?.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400">Sin resultados.</p>
          )}
          {data?.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                onChange({ id: b.id, name: b.name, payment_day: b.payment_day })
                setOpen(false)
                setTerm('')
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-emerald-50"
            >
              <span className="font-medium text-gray-800">{b.name}</span>
              {b.folio && <span className="text-xs text-gray-400">{b.folio}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
