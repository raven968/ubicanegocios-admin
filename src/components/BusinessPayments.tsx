import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { formatDate, money } from '../lib/cash'
import type { CashMovement, CashTotals, Paginated } from '../lib/types'
import Pagination from './Pagination'

type Response = Paginated<CashMovement> & { totals: CashTotals }

const PER_PAGE = 5

/**
 * Historial de cuotas cobradas a un cliente. Reusa el listado de movimientos de
 * cobranza filtrado por negocio y origen `fee`, así que la paginación y los
 * totales salen de la misma fuente que la pantalla de Cobranza.
 */
export default function BusinessPayments({ businessId }: { businessId: number }) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['cash', 'movements', 'business', businessId, page],
    queryFn: async () =>
      (
        await api.get<Response>('/admin/cash/movements', {
          params: { business_id: businessId, source: 'fee', per_page: PER_PAGE, page },
        })
      ).data,
  })

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5">
        <p className="text-sm font-medium text-gray-700">Detalles de abono</p>
        <p className="text-xs text-gray-500">
          Total abonado:{' '}
          <span className="font-semibold text-emerald-700">{money(data?.totals?.income ?? 0)}</span>
        </p>
      </div>

      <table className="w-full text-left text-sm">
        <thead className="bg-white text-xs text-gray-500">
          <tr>
            <th className="px-4 py-2 font-medium">Fecha</th>
            <th className="px-4 py-2 font-medium">Concepto</th>
            <th className="px-4 py-2 text-right font-medium">Monto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {isLoading && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                Cargando…
              </td>
            </tr>
          )}
          {data?.data.map((m) => (
            <tr key={m.id}>
              <td className="px-4 py-2.5 whitespace-nowrap text-gray-600">
                {formatDate(m.occurred_at)}
              </td>
              <td className="px-4 py-2.5 text-gray-900">{m.concept}</td>
              <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap text-emerald-700">
                {money(m.total)}
              </td>
            </tr>
          ))}
          {!isLoading && data?.data.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                Este cliente todavía no tiene cuotas registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination meta={data?.meta} onPageChange={setPage} />
    </div>
  )
}
