import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Minus, Plus } from 'lucide-react'
import api from '../lib/api'
import { downloadCsv, formatDate, money, monthRange, today } from '../lib/cash'
import type { CashMovement, CashTotals, MovementType, Paginated } from '../lib/types'
import CobranzaTabs from '../components/CobranzaTabs'
import MovementForm from '../components/MovementForm'
import Pagination from '../components/Pagination'

interface Filters {
  type: '' | MovementType
  source: '' | 'manual' | 'fee'
  from: string
  to: string
  search: string
}

type MovementsResponse = Paginated<CashMovement> & { totals: CashTotals }

const control =
  'rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none'

export default function Cobranza() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<{ type: MovementType; movement?: CashMovement } | null>(null)
  const [filters, setFilters] = useState<Filters>(() => {
    const { from, to } = monthRange(today())
    return { type: '', source: '', from, to, search: '' }
  })

  const params = {
    type: filters.type || undefined,
    source: filters.source || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    search: filters.search || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['cash', 'movements', params, page],
    queryFn: async () =>
      (await api.get<MovementsResponse>('/admin/cash/movements', { params: { ...params, page } }))
        .data,
  })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/cash/movements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cash'] }),
  })

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  const totals = data?.totals

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cobranza</h1>
          <p className="text-sm text-gray-500">Entradas y salidas de dinero.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setForm({ type: 'income' })}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Entrada
          </button>
          <button
            onClick={() => setForm({ type: 'expense' })}
            className="flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Minus className="h-4 w-4" /> Salida
          </button>
        </div>
      </div>

      <CobranzaTabs />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card label="Entradas" value={money(totals?.income ?? 0)} tone="emerald" />
        <Card label="Salidas" value={money(totals?.expense ?? 0)} tone="red" />
        <Card label="Balance" value={money(totals?.balance ?? 0)} tone="gray" />
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Desde</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilter('from', e.target.value)}
            className={control}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Hasta</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilter('to', e.target.value)}
            className={control}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Tipo</label>
          <select
            value={filters.type}
            onChange={(e) => setFilter('type', e.target.value as Filters['type'])}
            className={control}
          >
            <option value="">Todos</option>
            <option value="income">Entradas</option>
            <option value="expense">Salidas</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Origen</label>
          <select
            value={filters.source}
            onChange={(e) => setFilter('source', e.target.value as Filters['source'])}
            className={control}
          >
            <option value="">Todos</option>
            <option value="fee">Cuotas</option>
            <option value="manual">Manuales</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-gray-500">Buscar</label>
          <input
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Concepto o cliente…"
            className={`${control} w-full`}
          />
        </div>
        <button
          onClick={() => downloadCsv(params as Record<string, string | undefined>)}
          className="flex items-center gap-1.5 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3 text-right">Cant.</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Próximo cobro</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  Cargando…
                </td>
              </tr>
            )}
            {data?.data.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                  {formatDate(m.occurred_at)}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{m.concept}</p>
                  {m.notes && <p className="text-xs text-gray-400">{m.notes}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {m.business?.name ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{m.quantity}</td>
                <td className="px-4 py-3 text-right text-gray-600">{money(m.amount)}</td>
                <td
                  className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                    m.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {m.type === 'income' ? '+' : '−'}
                  {money(m.total)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                  {m.next_charge_date ? (
                    formatDate(m.next_charge_date)
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => setForm({ type: m.type, movement: m })}
                    className="text-sm text-emerald-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar el movimiento "${m.concept}"?`)) del.mutate(m.id)
                    }}
                    className="ml-3 text-sm text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No hay movimientos con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      {form && (
        <MovementForm
          defaultType={form.type}
          movement={form.movement}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  )
}

const tones = {
  emerald: 'text-emerald-700',
  red: 'text-red-700',
  gray: 'text-gray-900',
}

function Card({ label, value, tone }: { label: string; value: string; tone: keyof typeof tones }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  )
}
