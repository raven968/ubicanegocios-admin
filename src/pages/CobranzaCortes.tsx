import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import api from '../lib/api'
import { downloadCsv, formatMonth, money, monthRange, today } from '../lib/cash'
import type { CashSummary } from '../lib/types'
import CobranzaTabs from '../components/CobranzaTabs'

const control =
  'rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none'

export default function CobranzaCortes() {
  const [range, setRange] = useState(() => monthRange(today()))

  const { data, isLoading } = useQuery({
    queryKey: ['cash', 'summary', range],
    queryFn: async () =>
      (await api.get<CashSummary>('/admin/cash/summary', { params: range })).data,
  })

  /** Atajo: mover el corte a un mes completo desde un <input type="month">. */
  const pickMonth = (value: string) => {
    if (value) setRange(monthRange(`${value}-01`))
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Cortes y reportes</h1>
      <p className="mb-6 text-sm text-gray-500">
        Totales del periodo y descarga de los movimientos para Excel.
      </p>

      <CobranzaTabs />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Mes</label>
          <input
            type="month"
            value={range.from.slice(0, 7)}
            onChange={(e) => pickMonth(e.target.value)}
            className={control}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Desde</label>
          <input
            type="date"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className={control}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Hasta</label>
          <input
            type="date"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className={control}
          />
        </div>
        <button
          onClick={() => downloadCsv(range)}
          className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Download className="h-4 w-4" /> Descargar corte (CSV)
        </button>
      </div>

      {isLoading && <p className="text-gray-400">Cargando…</p>}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Total label="Entradas" value={money(data.income)} className="text-emerald-700" />
            <Total label="Salidas" value={money(data.expense)} className="text-red-700" />
            <Total
              label="Balance"
              value={money(data.balance)}
              className={data.balance >= 0 ? 'text-gray-900' : 'text-red-700'}
            />
            <Total label="Movimientos" value={String(data.count)} className="text-gray-900" />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Entradas por origen">
              <Row label="Cuotas de clientes" value={money(data.income_by_source.fee)} />
              <Row label="Entradas manuales" value={money(data.income_by_source.manual)} />
            </Panel>

            <Panel title="Clientes que más pagaron">
              {data.top_clients.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">Sin cuotas en el periodo.</p>
              )}
              {data.top_clients.map((c) => (
                <Row
                  key={c.business_id}
                  label={c.business_name}
                  hint={`${c.payments} pago(s)`}
                  value={money(c.total)}
                />
              ))}
            </Panel>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
              Desglose por mes
            </h2>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-2">Mes</th>
                  <th className="px-4 py-2 text-right">Entradas</th>
                  <th className="px-4 py-2 text-right">Salidas</th>
                  <th className="px-4 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.months.map((m) => (
                  <tr key={m.month}>
                    <td className="px-4 py-2 text-gray-700 capitalize">{formatMonth(m.month)}</td>
                    <td className="px-4 py-2 text-right text-emerald-700">{money(m.income)}</td>
                    <td className="px-4 py-2 text-right text-red-700">{money(m.expense)}</td>
                    <td
                      className={`px-4 py-2 text-right font-semibold ${
                        m.balance >= 0 ? 'text-gray-900' : 'text-red-700'
                      }`}
                    >
                      {money(m.balance)}
                    </td>
                  </tr>
                ))}
                {data.months.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                      Sin movimientos en el periodo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Total({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${className}`}>{value}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
        {title}
      </h2>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  )
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-gray-700">
        {label}
        {hint && <span className="ml-2 text-xs text-gray-400">{hint}</span>}
      </span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  )
}
