import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import api from '../lib/api'
import { formatDate, money, today } from '../lib/cash'
import type { DueCharge, DueChargesResponse } from '../lib/types'
import CobranzaTabs from '../components/CobranzaTabs'
import MovementForm from '../components/MovementForm'

export default function HojaCobro() {
  const [date, setDate] = useState(today())
  const [charging, setCharging] = useState<DueCharge | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['cash', 'due', date],
    queryFn: async () =>
      (await api.get<DueChargesResponse>('/admin/cash/due', { params: { date } })).data,
  })

  return (
    <div>
      <div className="flex items-start justify-between print:hidden">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Hoja de cobro</h1>
          <p className="mb-6 text-sm text-gray-500">
            Clientes a los que toca cobrar en la fecha elegida, más los que quedaron vencidos.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Printer className="h-4 w-4" /> Imprimir
        </button>
      </div>

      <CobranzaTabs />

      <div className="mb-4 flex items-end gap-3 print:hidden">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Fecha de cobro</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {isLoading && <p className="text-gray-400">Cargando…</p>}

      {data && (
        <section className="rounded-lg border border-gray-200 bg-white p-6 print:rounded-none print:border-0 print:p-0">
          <header className="mb-4 flex items-end justify-between border-b border-gray-200 pb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Hoja de cobro — UbicaNegocios</h2>
              <p className="text-sm text-gray-500">Corte al {formatDate(data.date)}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-gray-500">
                {data.count} cliente(s)
                {data.overdue_count > 0 && ` · ${data.overdue_count} vencido(s)`}
              </p>
              <p className="text-lg font-bold text-gray-900">{money(data.total)}</p>
            </div>
          </header>

          <table className="w-full text-left text-sm">
            <thead className="text-gray-500">
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-2 w-8">✓</th>
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">Folio</th>
                <th className="py-2 pr-3">Teléfono</th>
                <th className="py-2 pr-3">Concepto</th>
                <th className="py-2 pr-3">Vence</th>
                <th className="py-2 pr-3 text-right">Importe</th>
                <th className="py-2 print:hidden"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.data.map((charge) => (
                <tr key={charge.business_id}>
                  <td className="py-2.5 pr-2">
                    <span className="inline-block h-4 w-4 rounded-sm border border-gray-400" />
                  </td>
                  <td className="py-2.5 pr-3 font-medium text-gray-900">{charge.business_name}</td>
                  <td className="py-2.5 pr-3 text-gray-500">{charge.folio ?? '—'}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-gray-600">
                    {charge.phone ?? '—'}
                  </td>
                  <td className="py-2.5 pr-3 text-gray-600">{charge.concept}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-gray-600">
                    {formatDate(charge.next_charge_date)}
                    {charge.days_overdue > 0 && (
                      <span className="ml-1 text-xs font-medium text-red-600">
                        (+{charge.days_overdue}d)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-semibold whitespace-nowrap text-gray-900">
                    {money(charge.amount)}
                  </td>
                  <td className="py-2.5 print:hidden">
                    <button
                      onClick={() => setCharging(charge)}
                      className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Registrar cobro
                    </button>
                  </td>
                </tr>
              ))}
              {data.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No hay cobros pendientes para esta fecha.
                  </td>
                </tr>
              )}
            </tbody>
            {data.data.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={6} className="py-2 text-right font-semibold text-gray-700">
                    Total a cobrar
                  </td>
                  <td className="py-2 pr-3 text-right text-base font-bold text-gray-900">
                    {money(data.total)}
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            )}
          </table>

          <p className="mt-8 hidden text-xs text-gray-500 print:block">
            Cobrador: ____________________________ Firma: ____________________________
          </p>
        </section>
      )}

      {charging && (
        <MovementForm
          defaultType="income"
          defaultSource="fee"
          defaultBusiness={{
            id: charging.business_id,
            name: charging.business_name,
            payment_day: charging.payment_day,
          }}
          prefill={{
            concept: charging.concept,
            quantity: charging.quantity,
            amount: charging.unit_amount,
          }}
          onClose={() => setCharging(null)}
        />
      )}
    </div>
  )
}
