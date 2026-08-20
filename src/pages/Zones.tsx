import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import api from '../lib/api'
import type { Zone } from '../lib/types'
import SubmitButton from '../components/SubmitButton'

export default function Zones() {
  const qc = useQueryClient()
  const [newZone, setNewZone] = useState('')
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['zones'],
    queryFn: async () => (await api.get<{ data: Zone[] }>('/zones')).data.data,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['zones'] })

  const onError = (e: unknown) =>
    setError(
      (axios.isAxiosError(e) && e.response?.status === 422
        ? (e.response.data as { message?: string }).message
        : null) ?? 'No se pudo guardar la zona.',
    )

  const addZone = useMutation({
    mutationFn: (v: { name: string; order: number }) => api.post('/admin/zones', v),
    onSuccess: () => {
      setNewZone('')
      setError(null)
      invalidate()
    },
    onError,
  })

  const updateZone = useMutation({
    mutationFn: (v: { id: number; name: string; order?: number }) =>
      api.put(`/admin/zones/${v.id}`, { name: v.name, order: v.order }),
    onSuccess: () => {
      setEditing(null)
      setError(null)
      invalidate()
    },
    onError,
  })

  const delZone = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/zones/${id}`),
    onSuccess: invalidate,
  })

  const move = (zone: Zone, direction: -1 | 1) => {
    const zones = data ?? []
    const index = zones.findIndex((z) => z.id === zone.id)
    const swap = zones[index + direction]
    if (!swap) return
    updateZone.mutate({ id: zone.id, name: zone.name, order: swap.order })
    updateZone.mutate({ id: swap.id, name: swap.name, order: zone.order })
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Zonas</h1>
      <p className="mb-6 text-sm text-gray-500">
        Zonas de la ciudad (centro, norte, sur…) con las que se segmenta la búsqueda. Cada negocio
        puede pertenecer a una o varias.
      </p>

      {error && <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          const name = newZone.trim()
          if (name) addZone.mutate({ name, order: data?.length ?? 0 })
        }}
        className="mb-6 flex gap-2"
      >
        <input
          value={newZone}
          onChange={(e) => setNewZone(e.target.value)}
          placeholder="Nueva zona (ej. Centro)"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <SubmitButton loading={addZone.isPending} loadingLabel="Agregando…">
          Agregar
        </SubmitButton>
      </form>

      {isLoading && <p className="text-gray-400">Cargando…</p>}

      <div className="space-y-2">
        {data?.map((zone, i) => (
          <div
            key={zone.id}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <div className="flex flex-col text-gray-400">
              <button
                type="button"
                onClick={() => move(zone, -1)}
                disabled={i === 0}
                className="leading-none hover:text-emerald-600 disabled:opacity-30"
                title="Subir"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(zone, 1)}
                disabled={i === (data?.length ?? 0) - 1}
                className="leading-none hover:text-emerald-600 disabled:opacity-30"
                title="Bajar"
              >
                ▼
              </button>
            </div>

            {editing?.id === zone.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const name = editing.name.trim()
                  if (name) updateZone.mutate({ id: zone.id, name, order: zone.order })
                }}
                className="flex flex-1 gap-2"
              >
                <input
                  autoFocus
                  value={editing.name}
                  onChange={(e) => setEditing({ id: zone.id, name: e.target.value })}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
                <SubmitButton loading={updateZone.isPending} className="px-3 py-1.5">
                  Guardar
                </SubmitButton>
                <SubmitButton
                  type="button"
                  variant="outline"
                  disabled={updateZone.isPending}
                  onClick={() => setEditing(null)}
                  className="px-3 py-1.5"
                >
                  Cancelar
                </SubmitButton>
              </form>
            ) : (
              <>
                <span className="flex-1 font-semibold text-gray-900">{zone.name}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {zone.businesses_count ?? 0} negocios activos
                </span>
                <button
                  onClick={() => setEditing({ id: zone.id, name: zone.name })}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar la zona "${zone.name}"?`)) delZone.mutate(zone.id)
                  }}
                  disabled={delZone.isPending}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  {delZone.isPending && delZone.variables === zone.id ? 'Eliminando…' : 'Eliminar'}
                </button>
              </>
            )}
          </div>
        ))}
        {data?.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Aún no hay zonas. Agrega la primera arriba.
          </p>
        )}
      </div>
    </div>
  )
}
