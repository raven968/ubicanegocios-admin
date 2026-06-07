import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { Category } from '../lib/types'
import IconPicker, { IconPreview, iconNameToSlug } from '../components/IconPicker'

export default function Categories() {
  const qc = useQueryClient()
  const [newCat, setNewCat] = useState('')
  const [newIcon, setNewIcon] = useState<string | null>(null)
  const [subInputs, setSubInputs] = useState<Record<number, string>>({})
  const [pickerOpenFor, setPickerOpenFor] = useState<number | 'new' | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<{ data: Category[] }>('/categories')).data.data,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] })

  const addCat = useMutation({
    mutationFn: (v: { name: string; icon: string | null }) => api.post('/admin/categories', v),
    onSuccess: () => {
      setNewCat('')
      setNewIcon(null)
      invalidate()
    },
  })
  const updateCat = useMutation({
    mutationFn: (v: { id: number; name: string; icon: string | null }) =>
      api.put(`/admin/categories/${v.id}`, { name: v.name, icon: v.icon }),
    onSuccess: invalidate,
  })
  const delCat = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/categories/${id}`),
    onSuccess: invalidate,
  })
  const addSub = useMutation({
    mutationFn: (v: { category_id: number; name: string }) => api.post('/admin/subcategories', v),
    onSuccess: invalidate,
  })
  const delSub = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/subcategories/${id}`),
    onSuccess: invalidate,
  })

  const activeCategory = typeof pickerOpenFor === 'number' ? data?.find((c) => c.id === pickerOpenFor) : null
  const pickerValue =
    pickerOpenFor === 'new' ? newIcon : pickerOpenFor != null ? activeCategory?.icon ?? null : null

  const handlePickerChange = (value: string | null) => {
    if (pickerOpenFor === 'new') {
      setNewIcon(value)
    } else if (typeof pickerOpenFor === 'number' && activeCategory) {
      updateCat.mutate({ id: activeCategory.id, name: activeCategory.name, icon: value })
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Categorías</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (newCat.trim()) addCat.mutate({ name: newCat.trim(), icon: newIcon })
        }}
        className="mb-6 flex gap-2"
      >
        <button
          type="button"
          onClick={() => setPickerOpenFor('new')}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:border-emerald-500 hover:text-emerald-600"
          title={newIcon ? `Ícono: ${iconNameToSlug(newIcon)}` : 'Elegir ícono'}
        >
          {newIcon ? <IconPreview value={newIcon} /> : <span className="text-lg">＋</span>}
        </button>
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="Nueva categoría"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Agregar
        </button>
      </form>

      {isLoading && <p className="text-gray-400">Cargando…</p>}

      <div className="space-y-3">
        {data?.map((cat) => (
          <div key={cat.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPickerOpenFor(cat.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:border-emerald-500 hover:text-emerald-600"
                  title={cat.icon ? `Ícono: ${iconNameToSlug(cat.icon)}` : 'Elegir ícono'}
                >
                  {cat.icon ? <IconPreview value={cat.icon} /> : <span className="text-sm">＋</span>}
                </button>
                <span className="font-semibold text-gray-900">{cat.name}</span>
              </div>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar "${cat.name}" y sus subcategorías?`)) delCat.mutate(cat.id)
                }}
                className="text-sm text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {cat.subcategories?.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                >
                  {s.name}
                  <button
                    onClick={() => delSub.mutate(s.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const name = (subInputs[cat.id] ?? '').trim()
                if (name) {
                  addSub.mutate({ category_id: cat.id, name })
                  setSubInputs((s) => ({ ...s, [cat.id]: '' }))
                }
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={subInputs[cat.id] ?? ''}
                onChange={(e) => setSubInputs((s) => ({ ...s, [cat.id]: e.target.value }))}
                placeholder="Nueva subcategoría"
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
              />
              <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                + Subcategoría
              </button>
            </form>
          </div>
        ))}
      </div>

      <IconPicker
        open={pickerOpenFor != null}
        value={pickerValue ?? null}
        onChange={handlePickerChange}
        onClose={() => setPickerOpenFor(null)}
      />
    </div>
  )
}
