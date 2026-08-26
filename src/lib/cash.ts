import { useQuery } from '@tanstack/react-query'
import api from './api'
import { downloadCsv as download } from './download'
import type { DueChargesResponse } from './types'

const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

export const money = (value: number) => currency.format(value ?? 0)

/** 'YYYY-MM-DD' → '23 ago 2026', sin que el navegador lo corra por zona horaria. */
export function formatDate(value: string | null): string {
  if (!value) return '—'
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** '2026-08' → 'agosto 2026' */
export function formatMonth(value: string): string {
  const [y, m] = value.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

/** Fecha de hoy en 'YYYY-MM-DD' según la hora local, no UTC. */
export function today(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

/** Primer y último día del mes de la fecha dada, en 'YYYY-MM-DD'. */
export function monthRange(date: string): { from: string; to: string } {
  const [y, m] = date.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(last)}` }
}

/**
 * Próxima fecha de cobro sugerida: el día de pago del cliente, un mes después
 * del movimiento. Si ese mes no llega al día (31 en febrero) se recorre al
 * último día disponible.
 */
export function suggestNextCharge(occurredAt: string, paymentDay?: number | null): string | null {
  if (!paymentDay || !occurredAt) return null
  const [y, m] = occurredAt.split('-').map(Number)
  if (!y || !m) return null
  // `m` es 1-based, así que new Date(y, m, 1) ya cae en el mes siguiente.
  const next = new Date(y, m, 1)
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(Math.min(paymentDay, lastDay))}`
}

/**
 * Cobros pendientes del día. Se refresca solo al montar y al volver a la
 * ventana, que es cuando el usuario "entra" al panel.
 */
export function useDueCharges() {
  return useQuery({
    queryKey: ['cash', 'due'],
    queryFn: async () => (await api.get<DueChargesResponse>('/admin/cash/due')).data,
    staleTime: 5 * 60 * 1000,
  })
}

/** Descarga el CSV de movimientos con los filtros que se estén viendo. */
export async function downloadCsv(params: Record<string, string | undefined>) {
  return download(
    '/admin/cash/export',
    params,
    `cobranza_${params.from ?? ''}_a_${params.to ?? ''}.csv`,
  )
}
