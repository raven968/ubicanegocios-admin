import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { PLANS, type Business, type Category, type PlanSlug } from '../lib/types'

interface VideoInput {
  url: string
  orientation: 'horizontal' | 'vertical'
}

interface FormState {
  name: string
  description: string
  address: string
  phone: string
  email: string
  facebook: string
  instagram: string
  tiktok: string
  pinterest: string
  website: string
  videos: VideoInput[]
  tags: string
  active: boolean
  plan: PlanSlug | ''
  category_ids: number[]
  subcategory_ids: number[]
}

const empty: FormState = {
  name: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  facebook: '',
  instagram: '',
  tiktok: '',
  pinterest: '',
  website: '',
  videos: [],
  tags: '',
  active: true,
  plan: '',
  category_ids: [],
  subcategory_ids: [],
}

export default function BusinessForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<{ data: Category[] }>('/categories')).data.data,
  })

  const business = useQuery({
    queryKey: ['business', id],
    enabled: isEdit,
    queryFn: async () => (await api.get<{ data: Business }>(`/admin/businesses/${id}`)).data.data,
  })

  useEffect(() => {
    if (business.data) {
      const b = business.data
      setForm({
        name: b.name,
        description: b.description ?? '',
        address: b.address ?? '',
        phone: b.phone ?? '',
        email: b.email ?? '',
        facebook: b.facebook ?? '',
        instagram: b.instagram ?? '',
        tiktok: b.tiktok ?? '',
        pinterest: b.pinterest ?? '',
        website: b.website ?? '',
        videos: (b.videos ?? []).map((v) => ({ url: v.url, orientation: v.orientation })),
        tags: (b.tags ?? []).join(', '),
        active: b.active,
        plan: b.plan ?? '',
        category_ids: b.categories.map((c) => c.id),
        subcategory_ids: b.subcategories.map((s) => s.id),
      })
    }
  }, [business.data])

  const availableSubcategories = (categories.data ?? [])
    .filter((c) => form.category_ids.includes(c.id))
    .flatMap((c) => c.subcategories ?? [])

  const toggle = (key: 'category_ids' | 'subcategory_ids', value: number) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }))
  }

  const addVideo = () =>
    setForm((f) => ({ ...f, videos: [...f.videos, { url: '', orientation: 'horizontal' }] }))

  const updateVideo = (index: number, patch: Partial<VideoInput>) =>
    setForm((f) => ({
      ...f,
      videos: f.videos.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }))

  const removeVideo = (index: number) =>
    setForm((f) => ({ ...f, videos: f.videos.filter((_, i) => i !== index) }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description || null,
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      facebook: form.facebook || null,
      instagram: form.instagram || null,
      tiktok: form.tiktok || null,
      pinterest: form.pinterest || null,
      website: form.website || null,
      videos: form.videos
        .map((v) => ({ url: v.url.trim(), orientation: v.orientation }))
        .filter((v) => v.url),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      active: form.active,
      plan: form.plan || null,
      category_ids: form.category_ids,
      subcategory_ids: form.subcategory_ids,
    }
    try {
      if (isEdit) {
        await api.put(`/admin/businesses/${id}`, payload)
      } else {
        const res = await api.post<{ data: Business }>('/admin/businesses', payload)
        qc.invalidateQueries({ queryKey: ['businesses'] })
        navigate(`/negocios/${res.data.data.id}`, { replace: true })
        return
      }
      qc.invalidateQueries({ queryKey: ['businesses'] })
      qc.invalidateQueries({ queryKey: ['business', id] })
    } catch {
      setError('No se pudo guardar. Revisa los campos.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {isEdit ? 'Editar negocio' : 'Nuevo negocio'}
      </h1>

      {error && (
        <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2"
        >
        <Field label="Nombre">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
            required
          />
        </Field>

        <Field label="Descripción">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="input"
          />
        </Field>

        <Field label="Dirección">
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Calle, número, colonia, ciudad, estado"
            className="input"
          />
          <p className="mt-1 text-xs text-gray-500">
            Se usa también para el mapa de Google en la ficha pública.
          </p>
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Teléfono">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+52 33 1234 5678"
              className="input"
            />
          </Field>
          <Field label="Correo">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contacto@negocio.mx"
              className="input"
            />
          </Field>
        </div>

        <Field label="Videos (YouTube)">
          <div className="space-y-3">
            {form.videos.map((video, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-start gap-2">
                  <input
                    value={video.url}
                    onChange={(e) => updateVideo(i, { url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=…"
                    className="input"
                  />
                  <button
                    type="button"
                    onClick={() => removeVideo(i)}
                    className="shrink-0 rounded-md border border-gray-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Quitar
                  </button>
                </div>
                <div className="mt-2 flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`video_orientation_${i}`}
                      checked={video.orientation === 'horizontal'}
                      onChange={() => updateVideo(i, { orientation: 'horizontal' })}
                    />
                    <span className="text-gray-700">Horizontal (16:9)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`video_orientation_${i}`}
                      checked={video.orientation === 'vertical'}
                      onChange={() => updateVideo(i, { orientation: 'vertical' })}
                    />
                    <span className="text-gray-700">Vertical / Short (9:16)</span>
                  </label>
                </div>
              </div>
            ))}
            {form.videos.length === 0 && (
              <p className="text-sm text-gray-400">Aún no hay videos.</p>
            )}
            <button
              type="button"
              onClick={addVideo}
              className="rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-emerald-400"
            >
              + Agregar video
            </button>
          </div>
        </Field>

        <Field label="Tags (separados por coma)">
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="tacos, comida, pastor"
            className="input"
          />
        </Field>

        <Field label="Categorías">
          <div className="flex flex-wrap gap-2">
            {categories.data?.map((c) => (
              <Chip
                key={c.id}
                active={form.category_ids.includes(c.id)}
                onClick={() => toggle('category_ids', c.id)}
              >
                {c.name}
              </Chip>
            ))}
          </div>
        </Field>

        {availableSubcategories.length > 0 && (
          <Field label="Subcategorías">
            <div className="flex flex-wrap gap-2">
              {availableSubcategories.map((s) => (
                <Chip
                  key={s.id}
                  active={form.subcategory_ids.includes(s.id)}
                  onClick={() => toggle('subcategory_ids', s.id)}
                >
                  {s.name}
                </Chip>
              ))}
            </div>
          </Field>
        )}

        <Field label="Plan">
          <div className="flex items-center gap-3">
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value as PlanSlug | '' })}
              className="input"
            >
              <option value="">— Sin plan —</option>
              {PLANS.map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
            {form.plan && (
              <img
                src={PLANS.find((p) => p.slug === form.plan)?.image}
                alt=""
                className="h-12 w-12 shrink-0 object-contain"
              />
            )}
          </div>
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          <span className="font-medium text-gray-700">Activo (visible en la web)</span>
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/negocios')}
            className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
        </form>

        <SocialPanel form={form} setForm={setForm} />
      </div>

      {isEdit && business.data && <ImageManager business={business.data} />}

      <style>{`.input{width:100%;border:1px solid #d1d5db;border-radius:0.375rem;padding:0.5rem 0.75rem;font-size:0.875rem}.input:focus{outline:none;border-color:#10b981}`}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? 'border-emerald-600 bg-emerald-600 text-white'
          : 'border-gray-300 bg-white text-gray-600 hover:border-emerald-400'
      }`}
    >
      {children}
    </button>
  )
}

function SocialPanel({
  form,
  setForm,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
}) {
  const fields: { key: 'facebook' | 'instagram' | 'tiktok' | 'pinterest' | 'website'; label: string; placeholder: string }[] = [
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/tunegocio' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/tunegocio' },
    { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@tunegocio' },
    { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/tunegocio' },
    { key: 'website', label: 'Página web', placeholder: 'https://tunegocio.com' },
  ]

  return (
    <aside className="h-fit space-y-4 self-start rounded-xl border border-gray-200 bg-white p-6 lg:col-span-1">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Redes sociales y web</h2>
        <p className="mt-1 text-xs text-gray-500">Opcional. Pega la URL completa de cada perfil.</p>
      </div>
      {fields.map((f) => (
        <Field key={f.key} label={f.label}>
          <input
            type="url"
            value={form[f.key]}
            onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            className="input"
          />
        </Field>
      ))}
    </aside>
  )
}

function ImageManager({ business }: { business: Business }) {
  const qc = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const refresh = () => qc.invalidateQueries({ queryKey: ['business', String(business.id)] })

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const fd = new FormData()
    Array.from(files).forEach((f) => fd.append('images[]', f))
    try {
      await api.post(`/admin/businesses/${business.id}/images`, fd)
      refresh()
    } finally {
      setUploading(false)
    }
  }

  const onDelete = async (imageId: number) => {
    await api.delete(`/admin/images/${imageId}`)
    refresh()
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">Imágenes</h2>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {business.images.map((img) => (
          <div key={img.id} className="group relative overflow-hidden rounded-lg border border-gray-200">
            <img src={img.url} alt="" className="h-28 w-full object-cover" />
            <button
              onClick={() => onDelete(img.id)}
              className="absolute right-1 top-1 rounded bg-red-600/90 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              Borrar
            </button>
          </div>
        ))}
        {business.images.length === 0 && (
          <p className="col-span-full text-sm text-gray-400">Aún no hay imágenes.</p>
        )}
      </div>
      <label className="inline-block cursor-pointer rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-emerald-400">
        {uploading ? 'Subiendo…' : '+ Subir imágenes'}
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => onUpload(e.target.files)}
        />
      </label>
    </div>
  )
}
