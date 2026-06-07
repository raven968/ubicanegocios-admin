import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import Stars from '../components/Stars'
import type { Business, Paginated, Review } from '../lib/types'

export default function Dashboard() {
  const businesses = useQuery({
    queryKey: ['businesses', 'count'],
    queryFn: async () => (await api.get<Paginated<Business>>('/admin/businesses')).data,
  })
  const reviews = useQuery({
    queryKey: ['reviews', 'recent'],
    queryFn: async () => (await api.get<Paginated<Review>>('/admin/reviews')).data,
  })

  const totalBusinesses = businesses.data?.meta?.total ?? businesses.data?.data.length ?? 0
  const totalReviews = reviews.data?.meta?.total ?? reviews.data?.data.length ?? 0

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Negocios" value={totalBusinesses} />
        <Stat label="Reseñas" value={totalReviews} />
        <Stat
          label="Inactivos"
          value={businesses.data?.data.filter((b) => !b.active).length ?? 0}
        />
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-gray-900">{value}</div>
    </div>
  )
}
