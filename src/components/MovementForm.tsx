import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { X } from 'lucide-react'
import api from '../lib/api'
import { formatDate, money, suggestNextCharge, today } from '../lib/cash'
import type { BusinessRef, CashMovement, MovementSource, MovementType } from '../lib/types'
import BusinessPicker from './BusinessPicker'
import SubmitButton from './SubmitButton'

interface Props {
  /** Movimiento a editar; si no viene, es alta. */
  movement?: CashMovement | null
  defaultType?: MovementType
  defaultSource?: MovementSource
  /** Precarga el cliente, p. ej. al cobrar desde la hoja de cobro. */
  defaultBusiness?: BusinessRef | null
  /** Copia concepto y montos del último cobro para no recapturarlos. */
  prefill?: { concept?: string; quantity?: number; amount?: number }
  onClose: () => void
}

interface FormState {
  type: MovementType
  source: MovementSource
  business: BusinessRef | null
  concept: string
  quantity: string
  amount: string
  occurred_at: string
  next_charge_date: string
  notes: string
}

const label = 'mb-1 block text-sm font-medium text-gray-700'
const field =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none'

export default function MovementForm({
  movement,
  defaultType = 'income',
  defaultSource = 'manual',
  defaultBusiness = null,
  prefill,
  onClose,
}: Props) {
  const qc = useQueryClient()
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const [form, setForm] = useState<FormState>(() => {
    const business: BusinessRef | null = movement?.business
      ? {
          id: movement.business.id,
          name: movement.business.name,
          payment_day: movement.business.payment_day,
        }
      : defaultBusiness
    const occurredAt = movement?.occurred_at ?? today()

    return {
      type: movement?.type ?? defaultType,
      source: movement?.source ?? (defaultBusiness ? 'fee' : defaultSource),
      business,
      concept: movement?.concept ?? prefill?.concept ?? '',
      quantity: String(movement?.quantity ?? prefill?.quantity ?? 1),
      amount: String(movement?.amount ?? prefill?.amount ?? ''),
      occurred_at: occurredAt,
      next_charge_date:
        movement?.next_charge_date ?? suggestNextCharge(occurredAt, business?.payment_day) ?? '',
      notes: movement?.notes ?? '',
    }
  })

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  /**
   * Cambia el cliente o la fecha arrastrando la sugerencia de próximo cobro,
   * salvo que el usuario ya haya escrito una fecha propia.
   */
  const setAndSuggest = (patch: Partial<FormState>) =>
    setForm((f) => {
      const merged = { ...f, ...patch }
      const suggested = suggestNextCharge(merged.occurred_at, merged.business?.payment_day)
      const untouched =
        !f.next_charge_date ||
        f.next_charge_date === suggestNextCharge(f.occurred_at, f.business?.payment_day)

      return suggested && untouched ? { ...merged, next_charge_date: suggested } : merged
    })

  const isFee = form.type === 'income' && form.source === 'fee'
  const total = (Number(form.quantity) || 0) * (Number(form.amount) || 0)
  const suggested = suggestNextCharge(form.occurred_at, form.business?.payment_day)

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      movement
        ? api.put(`/admin/cash/movements/${movement.id}`, payload)
        : api.post('/admin/cash/movements', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash'] })
      onClose()
    },
    onError: (e: unknown) => {
      if (axios.isAxiosError(e) && e.response?.status === 422) {
        setErrors((e.response.data as { errors?: Record<string, string[]> }).errors ?? {})
      } else {
        setErrors({ general: ['No se pudo guardar el movimiento.'] })
      }
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    save.mutate({
      type: form.type,
      source: isFee ? 'fee' : 'manual',
      business_id: isFee ? form.business?.id ?? null : null,
      concept: form.concept.trim(),
      quantity: Number(form.quantity) || 0,
      amount: Number(form.amount) || 0,
      occurred_at: form.occurred_at,
      next_charge_date: isFee ? form.next_charge_date || null : null,
      notes: form.notes.trim() || null,
    })
  }

  const error = (key: string) =>
    errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key][0]}</p>

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-auto bg-gray-900/50 p-4">
      <form
        onSubmit={submit}
        className="my-8 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {movement ? 'Editar movimiento' : form.type === 'income' ? 'Nueva entrada' : 'Nueva salida'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {errors.general && (
          <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.general[0]}
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => set('type', 'income')}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              form.type === 'income'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Entrada
          </button>
          <button
            type="button"
            onClick={() => {
              set('type', 'expense')
              set('source', 'manual')
            }}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              form.type === 'expense'
                ? 'border-red-600 bg-red-50 text-red-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Salida
          </button>
        </div>

        {form.type === 'income' && (
          <div className="mb-4">
            <span className={label}>Tipo de entrada</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => set('source', 'manual')}
                className={`rounded-md border px-3 py-2 text-xs font-medium ${
                  form.source === 'manual'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Manual (libre)
              </button>
              <button
                type="button"
                onClick={() => set('source', 'fee')}
                className={`rounded-md border px-3 py-2 text-xs font-medium ${
                  form.source === 'fee'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Cuota de cliente
              </button>
            </div>
          </div>
        )}

        {isFee && (
          <div className="mb-4">
            <span className={label}>Cliente</span>
            <BusinessPicker value={form.business} onChange={(b) => setAndSuggest({ business: b })} />
            {error('business_id')}
          </div>
        )}

        <div className="mb-4">
          <label className={label} htmlFor="concept">
            Concepto
          </label>
          <input
            id="concept"
            value={form.concept}
            onChange={(e) => set('concept', e.target.value)}
            placeholder={form.type === 'income' ? 'Mensualidad plan Pro' : 'Gasolina, papelería…'}
            className={field}
          />
          {error('concept')}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="quantity">
              Cantidad
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              step={1}
              value={form.quantity}
              onChange={(e) => set('quantity', e.target.value)}
              className={field}
            />
            {error('quantity')}
          </div>
          <div>
            <label className={label} htmlFor="amount">
              Monto unitario
            </label>
            <input
              id="amount"
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              placeholder="0.00"
              className={field}
            />
            {error('amount')}
          </div>
        </div>

        <div className="mb-4 rounded-md bg-gray-50 px-3 py-2 text-sm">
          <span className="text-gray-500">Total: </span>
          <span
            className={`font-bold ${form.type === 'income' ? 'text-emerald-700' : 'text-red-700'}`}
          >
            {money(total)}
          </span>
        </div>

        <div className={`mb-4 grid gap-3 ${isFee ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <label className={label} htmlFor="occurred_at">
              Fecha del movimiento
            </label>
            <input
              id="occurred_at"
              type="date"
              value={form.occurred_at}
              onChange={(e) => setAndSuggest({ occurred_at: e.target.value })}
              className={field}
            />
            {error('occurred_at')}
          </div>
          {isFee && (
            <div>
              <label className={label} htmlFor="next_charge_date">
                Próxima fecha de cobro
              </label>
              <input
                id="next_charge_date"
                type="date"
                value={form.next_charge_date}
                onChange={(e) => set('next_charge_date', e.target.value)}
                className={field}
              />
              {suggested && suggested !== form.next_charge_date && (
                <p className="mt-1 text-xs text-gray-500">
                  Día de pago {form.business?.payment_day}:{' '}
                  <button
                    type="button"
                    onClick={() => set('next_charge_date', suggested)}
                    className="font-medium text-emerald-600 hover:underline"
                  >
                    usar {formatDate(suggested)}
                  </button>
                </p>
              )}
              {!form.business?.payment_day && form.business && (
                <p className="mt-1 text-xs text-gray-400">
                  Este cliente no tiene día de pago capturado.
                </p>
              )}
              {error('next_charge_date')}
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className={label} htmlFor="notes">
            Notas <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            id="notes"
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            className={field}
          />
          {error('notes')}
        </div>

        <div className="flex justify-end gap-2">
          <SubmitButton type="button" variant="outline" onClick={onClose}>
            Cancelar
          </SubmitButton>
          <SubmitButton loading={save.isPending}>
            {movement ? 'Guardar cambios' : 'Registrar'}
          </SubmitButton>
        </div>
      </form>
    </div>
  )
}
