import { useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import api from '../lib/api'
import { today } from '../lib/cash'
import { downloadCsv } from '../lib/download'
import Pagination from '../components/Pagination'
import { PLANS, type Business, type Paginated } from '../lib/types'

export default function Businesses() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [active, setActive] = useState<'' | '1' | '0'>('')
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)

  const filters = { search: search || undefined, active: active || undefined }

  const { data, isLoading } = useQuery({
    queryKey: ['businesses', filters, page],
    queryFn: async () =>
      (await api.get<Paginated<Business>>('/admin/businesses', { params: { ...filters, page } }))
        .data,
    placeholderData: keepPreviousData,
  })

  const onExport = async () => {
    setExporting(true)
    try {
      await downloadCsv('/admin/businesses/export', filters, `negocios_${today()}.csv`)
    } finally {
      setExporting(false)
    }
  }

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/businesses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['businesses'] }),
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Negocios</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <Download className="h-4 w-4" /> {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
          <Link
            to="/negocios/nuevo"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + Nuevo negocio
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Buscar por nombre o folio…"
          className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <select
          value={active}
          onChange={(e) => {
            setActive(e.target.value as '' | '1' | '0')
            setPage(1)
          }}
          aria-label="Filtrar por estado"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="1">Solo activos</option>
          <option value="0">Solo inactivos</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categorías</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Reseñas</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Cargando…
                </td>
              </tr>
            )}
            {data?.data.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.folio || '—'}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                <td className="px-4 py-3 text-gray-600">
                  {b.categories.map((c) => c.name).join(', ') || '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {(() => {
                    const p = PLANS.find((pp) => pp.slug === b.plan)
                    return p ? (
                      <span className="inline-flex items-center gap-1.5">
                        <img src={p.image} alt="" className="h-6 w-6 object-contain" />
                        <span className="text-xs text-gray-700">{p.name}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )
                  })()}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {b.reviews_count} {b.reviews_count > 0 && `(${b.average_rating}★)`}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      b.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {b.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/negocios/${b.id}`} className="text-emerald-600 hover:underline">
                    Editar
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar "${b.name}"?`)) del.mutate(b.id)
                    }}
                    className="ml-3 text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Sin negocios.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>
    </div>
  )
}
