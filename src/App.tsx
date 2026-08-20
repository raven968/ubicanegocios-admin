import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Businesses from './pages/Businesses'
import BusinessForm from './pages/BusinessForm'
import Categories from './pages/Categories'
import Zones from './pages/Zones'
import Reviews from './pages/Reviews'
import Users from './pages/Users'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Cargando…</div>
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/negocios" element={<Businesses />} />
        <Route path="/negocios/nuevo" element={<BusinessForm />} />
        <Route path="/negocios/:id" element={<BusinessForm />} />
        <Route path="/categorias" element={<Categories />} />
        <Route path="/zonas" element={<Zones />} />
        <Route path="/resenas" element={<Reviews />} />
        <Route path="/usuarios" element={<Users />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
