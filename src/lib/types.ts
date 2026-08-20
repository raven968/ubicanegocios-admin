export type PlanSlug = 'fundador' | 'estrella' | 'pro' | 'destaca' | 'emprende' | 'lite'

export interface PlanInfo {
  slug: PlanSlug
  name: string
  image: string
}

export const PLANS: PlanInfo[] = [
  { slug: 'fundador', name: 'Negocio Fundador', image: '/planes/fundador.png' },
  { slug: 'estrella', name: 'Negocio Estrella', image: '/planes/estrella.png' },
  { slug: 'pro', name: 'Ubica Pro', image: '/planes/pro.png' },
  { slug: 'destaca', name: 'Destaca', image: '/planes/destaca.png' },
  { slug: 'emprende', name: 'Emprende', image: '/planes/emprende.png' },
  { slug: 'lite', name: 'Ubica Lite', image: '/planes/lite.png' },
]

export interface Subcategory {
  id: number
  category_id: number
  name: string
  slug: string
  order: number
}

export interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
  order: number
  subcategories?: Subcategory[]
  businesses_count?: number
}

export interface Zone {
  id: number
  name: string
  slug: string
  order: number
  businesses_count?: number
}

export interface BusinessImage {
  id: number
  url: string
  order: number
}

export interface BusinessVideo {
  id: number
  url: string
  orientation: 'horizontal' | 'vertical'
  order: number
}

export interface Business {
  id: number
  name: string
  slug: string
  /** Solo lo devuelven los endpoints de admin. */
  folio: string | null
  description: string | null
  address: string | null
  phone: string | null
  phone2: string | null
  whatsapp_phone: 'phone' | 'phone2' | null
  email: string | null
  facebook: string | null
  instagram: string | null
  tiktok: string | null
  pinterest: string | null
  website: string | null
  tags: string[]
  active: boolean
  plan: PlanSlug | null
  average_rating: number
  reviews_count: number
  images: BusinessImage[]
  videos: BusinessVideo[]
  categories: Category[]
  subcategories: Subcategory[]
  zones: Zone[]
  created_at: string
}

export interface Review {
  id: number
  business_id: number
  author_name: string
  body: string
  rating: number
  created_at: string
  business?: { id: number; name: string; slug: string }
}

export interface AuthUser {
  id: number
  name: string
  email: string
  roles: string[]
  abilities: string[]
}

export interface Paginated<T> {
  data: T[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    from: number | null
    to: number | null
    total: number
  }
  links?: unknown
}
