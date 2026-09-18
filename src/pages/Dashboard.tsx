import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import Stars from '../components/Stars'
import type { BusinessStats, Paginated, Review } from '../lib/types'

export default function Dashboard() {
  const stats = useQuery({
    queryKey: ['businesses', 'stats'],
    queryFn: async () => (await api.get<BusinessStats>('/admin/businesses/stats')).data,
  })
  const reviews = useQuery({
    queryKey: ['reviews', 'recent'],
    queryFn: async () => (await api.get<Paginated<Review>>('/admin/reviews')).data,
  })

  const totalReviews = reviews.data?.meta?.total ?? reviews.data?.data.length ?? 0

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Stat label="Negocios" value={stats.data?.total} />
        <Stat label="Activos" value={stats.data?.active} />
        <Stat label="Inactivos" value={stats.data?.inactive} />
        <Stat label="Reseñas" value={totalReviews} />
      </div>

      <h2 className="mb-3 text-lg font-semibold text-gray-800">Reseñas recientes</h2>
      <div className="space-y-2">
        {reviews.data?.data.slice(0, 8).map((r) => (
          <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{r.author_name}</span>
              <Stars rating={r.rating} />
            </div>
            <p className="text-gray-600">{r.body}</p>
            {r.business && <p className="mt-1 text-xs text-gray-400">en {r.business.name}</p>}
          </div>
        ))}
        {reviews.data?.data.length === 0 && (
          <p className="text-sm text-gray-500">Aún no hay reseñas.</p>
        )}
      </div>
    </div>
  )
}

/** Mientras carga muestra un guion, para no dar por bueno un cero que aún no se sabe. */
function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-gray-900">{value ?? '—'}</div>
    </div>
  )
}
