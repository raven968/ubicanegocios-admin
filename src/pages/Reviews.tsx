import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import Stars from '../components/Stars'
import type { Paginated, Review } from '../lib/types'

export default function Reviews() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => (await api.get<Paginated<Review>>('/admin/reviews')).data,
  })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/reviews/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  })

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Reseñas</h1>

      {isLoading && <p className="text-gray-400">Cargando…</p>}

      <div className="space-y-3">
        {data?.data.map((r) => (
          <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="mr-2 font-medium text-gray-900">{r.author_name}</span>
                <Stars rating={r.rating} />
              </div>
              <button
                onClick={() => {
                  if (confirm('¿Eliminar esta reseña?')) del.mutate(r.id)
                }}
                className="text-sm text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </div>
            <p className="mt-1 text-gray-700">{r.body}</p>
            <p className="mt-1 text-xs text-gray-400">
              {r.business?.name} · {new Date(r.created_at).toLocaleString()}
            </p>
          </div>
        ))}
        {data?.data.length === 0 && <p className="text-sm text-gray-500">No hay reseñas.</p>}
      </div>
    </div>
  )
}
