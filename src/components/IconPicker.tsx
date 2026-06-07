import { useMemo, useState, useEffect, useRef } from 'react'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICON_ENTRIES: { name: string; slug: string; Component: LucideIcon }[] = (() => {
  const seen = new Set<string>()
  const entries: { name: string; slug: string; Component: LucideIcon }[] = []
  for (const [name, value] of Object.entries(Icons)) {
    if (!/^[A-Z]/.test(name)) continue
    if (name === 'Icon' || name === 'LucideIcon' || name === 'createLucideIcon') continue
    if (name.endsWith('Icon')) continue
    const slug = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    if (seen.has(slug)) continue
    seen.add(slug)
    entries.push({ name, slug, Component: value as LucideIcon })
  }
  return entries.sort((a, b) => a.slug.localeCompare(b.slug))
})()

const ICON_BY_SLUG = new Map(ICON_ENTRIES.map((e) => [e.slug, e]))

export function iconNameToSlug(value: string | null | undefined): string | null {
  if (!value) return null
  return value.startsWith('lucide:') ? value.slice(7) : value
}

export function IconPreview({ value, className = 'h-5 w-5' }: { value: string | null; className?: string }) {
  const slug = iconNameToSlug(value)
  const entry = slug ? ICON_BY_SLUG.get(slug) : null
  if (!entry) return null
  const Cmp = entry.Component
  return <Cmp className={className} />
}

interface Props {
  value: string | null
  onChange: (value: string | null) => void
  open: boolean
  onClose: () => void
}

export default function IconPicker({ value, onChange, open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const currentSlug = iconNameToSlug(value)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q ? ICON_ENTRIES.filter((e) => e.slug.includes(q)) : ICON_ENTRIES
    return base.slice(0, 300)
  }, [query])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">Elegir ícono</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-gray-200 p-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar entre ${ICON_ENTRIES.length} íconos…`}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {currentSlug && !query && (
            <div className="mb-3 flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-sm">
              <span className="text-emerald-800">
                Actual: <code className="font-mono">{currentSlug}</code>
              </span>
              <button
                type="button"
                onClick={() => {
                  onChange(null)
                  onClose()
                }}
                className="text-xs text-red-600 hover:underline"
              >
                Quitar ícono
              </button>
            </div>
          )}

          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {filtered.map(({ slug, Component }) => {
              const selected = slug === currentSlug
              return (
                <button
                  key={slug}
                  type="button"
                  title={slug}
                  onClick={() => {
                    onChange(`lucide:${slug}`)
                    onClose()
                  }}
                  className={`flex aspect-square items-center justify-center rounded-md border text-gray-700 transition hover:border-emerald-500 hover:bg-emerald-50 ${
                    selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                  }`}
                >
                  <Component className="h-5 w-5" />
                </button>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">Sin resultados.</p>
          )}
          {filtered.length === 300 && (
            <p className="mt-3 text-center text-xs text-gray-400">
              Mostrando los primeros 300. Refiná la búsqueda para ver más.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
