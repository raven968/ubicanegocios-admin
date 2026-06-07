import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/negocios', label: 'Negocios' },
  { to: '/categorias', label: 'Categorías' },
  { to: '/resenas', label: 'Reseñas' },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <aside className="flex w-60 flex-col bg-gray-900 text-gray-100">
        <div className="px-5 py-6 text-xl font-bold tracking-tight">
          Ubica<span className="text-emerald-400">Negocios</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-800 px-5 py-4 text-sm">
          <div className="truncate text-gray-400">{user?.email}</div>
          <button
            onClick={() => logout()}
            className="mt-2 text-emerald-400 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
