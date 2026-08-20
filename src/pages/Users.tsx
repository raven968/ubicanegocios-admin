import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../lib/auth'
import SubmitButton from '../components/SubmitButton'

interface AdminUser {
  id: number
  name: string
  email: string
  roles: string[]
}

interface FormState {
  name: string
  email: string
  password: string
  is_admin: boolean
}

const empty: FormState = { name: '', email: '', password: '', is_admin: false }

export default function Users() {
  const qc = useQueryClient()
  const { user: current } = useAuth()
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [creating, setCreating] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get<AdminUser[]>('/admin/users')).data,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] })

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: invalidate,
  })

  const toggleAdmin = useMutation({
    mutationFn: (v: { id: number; isAdmin: boolean }) =>
      api.put(`/admin/users/${v.id}/roles`, { roles: v.isAdmin ? ['admin'] : [] }),
    onSuccess: invalidate,
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Nuevo usuario
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Cargando…
                </td>
              </tr>
            )}
            {data?.map((u) => {
              const isAdmin = u.roles.includes('admin')
              const isSelf = current?.id === u.id
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {u.name} {isSelf && <span className="text-xs text-gray-400">(tú)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isAdmin}
                        disabled={isSelf || toggleAdmin.isPending}
                        onChange={(e) => toggleAdmin.mutate({ id: u.id, isAdmin: e.target.checked })}
                      />
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          isAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isAdmin ? 'Admin' : 'Sin permisos'}
                      </span>
                    </label>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditing(u)} className="text-emerald-600 hover:underline">
                      Editar
                    </button>
                    {!isSelf && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar "${u.name}"?`)) del.mutate(u.id)
                        }}
                        className="ml-3 text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {data?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Sin usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <UserModal
          title="Nuevo usuario"
          initial={empty}
          requirePassword
          submitLabel="Crear"
          onCancel={() => setCreating(false)}
          onSubmit={async (values) => {
            await api.post('/admin/users', {
              name: values.name,
              email: values.email,
              password: values.password,
              roles: values.is_admin ? ['admin'] : [],
            })
            setCreating(false)
            invalidate()
          }}
        />
      )}

      {editing && (
        <UserModal
          title={`Editar ${editing.name}`}
          initial={{
            name: editing.name,
            email: editing.email,
            password: '',
            is_admin: editing.roles.includes('admin'),
          }}
          submitLabel="Guardar"
          hideAdmin={current?.id === editing.id}
          onCancel={() => setEditing(null)}
          onSubmit={async (values) => {
            await api.put(`/admin/users/${editing.id}`, {
              name: values.name,
              email: values.email,
              password: values.password || undefined,
            })
            if (current?.id !== editing.id) {
              await api.put(`/admin/users/${editing.id}/roles`, {
                roles: values.is_admin ? ['admin'] : [],
              })
            }
            setEditing(null)
            invalidate()
          }}
        />
      )}
    </div>
  )
}

interface ModalProps {
  title: string
  initial: FormState
  submitLabel: string
  requirePassword?: boolean
  hideAdmin?: boolean
  onCancel: () => void
  onSubmit: (values: FormState) => Promise<void>
}

function UserModal({
  title,
  initial,
  submitLabel,
  requirePassword,
  hideAdmin,
  onCancel,
  onSubmit,
}: ModalProps) {
  const [form, setForm] = useState<FormState>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await onSubmit(form)
    } catch (err) {
      const apiErr = err as { response?: { data?: { message?: string } } }
      setError(apiErr.response?.data?.message ?? 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">{title}</h2>

        {error && (
          <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={submit} className="space-y-4 text-sm">
          <label className="block">
            <span className="mb-1 block font-medium text-gray-700">Nombre</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block font-medium text-gray-700">Correo</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block font-medium text-gray-700">
              Contraseña {!requirePassword && <span className="text-gray-400">(dejar vacío para no cambiar)</span>}
            </span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              minLength={8}
              required={requirePassword}
              autoComplete="new-password"
            />
          </label>

          {!hideAdmin && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_admin}
                onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
              />
              <span className="font-medium text-gray-700">Administrador</span>
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <SubmitButton loading={saving}>{submitLabel}</SubmitButton>
          </div>
        </form>

        <style>{`.input{width:100%;border:1px solid #d1d5db;border-radius:0.375rem;padding:0.5rem 0.75rem;font-size:0.875rem}.input:focus{outline:none;border-color:#10b981}`}</style>
      </div>
    </div>
  )
}
