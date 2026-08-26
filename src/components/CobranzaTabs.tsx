import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/cobranza', label: 'Movimientos', end: true },
  { to: '/cobranza/cortes', label: 'Cortes y reportes' },
  { to: '/cobranza/hoja', label: 'Hoja de cobro' },
]

export default function CobranzaTabs() {
  return (
    <nav className="mb-6 flex gap-1 border-b border-gray-200 print:hidden">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              isActive
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
