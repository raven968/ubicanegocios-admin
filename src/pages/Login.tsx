import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import SubmitButton from '../components/SubmitButton'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@ubicanegocios.test')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) {
    navigate('/', { replace: true })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch {
      setError('Credenciales inválidas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md"
      >
        <h1 className="mb-1 text-2xl font-bold text-gray-900">
          Ubica<span className="text-emerald-600">Negocios</span>
        </h1>
        <p className="mb-6 text-sm text-gray-500">Panel de administración</p>

        {error && (
          <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Correo</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            required
          />
        </label>
        <label className="mb-5 block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
            required
          />
        </label>
        <SubmitButton loading={loading} loadingLabel="Entrando…" className="w-full">
          Iniciar sesión
        </SubmitButton>
      </form>
    </div>
  )
}
