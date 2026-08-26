import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Printer, X } from 'lucide-react'
import { money, formatDate, today, useDueCharges } from '../lib/cash'
import type { DueCharge } from '../lib/types'
import MovementForm from './MovementForm'

const DISMISS_KEY = 'ubica_cobranza_aviso'

/**
 * Aviso de cobros del día. No se cierra solo: queda fijo hasta que el usuario
 * lo cierra, y se guarda por día para que vuelva a aparecer mañana.
 */
export default function DueChargesBanner() {
  const { data } = useDueCharges()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === today())
  const [charging, setCharging] = useState<DueCharge | null>(null)

  const close = () => {
    localStorage.setItem(DISMISS_KEY, today())
    setDismissed(true)
  }

  if (dismissed || !data || data.count === 0) return null

  return (
    <>
      <aside className="fixed right-6 bottom-6 z-30 w-96 overflow-hidden rounded-lg border border-amber-300 bg-white shadow-2xl print:hidden">
        <header className="flex items-start gap-2 bg-amber-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-amber-900">
              {data.count} {data.count === 1 ? 'cobro pendiente' : 'cobros pendientes'}
            </h2>
            <p className="text-xs text-amber-700">
              {money(data.total)} por cobrar
              {data.overdue_count > 0 && ` · ${data.overdue_count} vencido(s)`}
            </p>
          </div>
          <button
            onClick={close}
            title="Cerrar aviso por hoy"
            className="text-amber-600 hover:text-amber-900"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <ul className="max-h-72 divide-y divide-gray-100 overflow-auto">
          {data.data.map((charge) => (
            <li key={charge.business_id} className="flex items-center gap-2 px-4 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{charge.business_name}</p>
                <p className="text-xs text-gray-500">
                  {money(charge.amount)} ·{' '}
                  {charge.days_overdue > 0 ? (
                    <span className="font-medium text-red-600">
                      vencido {charge.days_overdue} día(s)
                    </span>
                  ) : (
                    `vence ${formatDate(charge.next_charge_date)}`
                  )}
                </p>
              </div>
              <button
                onClick={() => setCharging(charge)}
                className="shrink-0 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Cobrar
              </button>
            </li>
          ))}
        </ul>

        <footer className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2">
          <Link
            to="/cobranza/hoja"
            onClick={close}
            className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
          >
            <Printer className="h-3.5 w-3.5" /> Hoja de cobro
          </Link>
          <button onClick={close} className="text-xs text-gray-500 hover:underline">
            Cerrar por hoy
          </button>
        </footer>
      </aside>

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
    </>
  )
}
