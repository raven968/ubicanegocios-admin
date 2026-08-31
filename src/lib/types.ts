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
  /** Cobranza. Solo lo devuelven los endpoints de admin. */
  joined_at: string | null
  contact_name: string | null
  /** Día del mes (1-31) en que toca cobrarle la cuota. */
  payment_day: number | null
  /** Cliente que por acuerdo no paga; queda fuera de la hoja de cobro. */
  payment_exempt: boolean
  /** Motivo de la exención u otras notas de cobranza. Interno. */
  billing_notes: string | null
  average_rating: number
  reviews_count: number
  images: BusinessImage[]
  videos: BusinessVideo[]
  categories: Category[]
  subcategories: Subcategory[]
  zones: Zone[]
  created_at: string
}

/** Cliente elegido en cobranza: lo mínimo para identificarlo y sugerir su próximo cobro. */
export interface BusinessRef {
  id: number
  name: string
  payment_day?: number | null
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

export type MovementType = 'income' | 'expense'
/** `manual` = captura libre; `fee` = cuota cobrada a un cliente. */
export type MovementSource = 'manual' | 'fee'

export interface CashMovement {
  id: number
  type: MovementType
  source: MovementSource
  concept: string
  quantity: number
  /** Monto unitario. */
  amount: number
  /** quantity × amount, calculado en la API. */
  total: number
  occurred_at: string
  next_charge_date: string | null
  notes: string | null
  business?: {
    id: number
    name: string
    folio: string | null
    phone: string | null
    plan: PlanSlug | null
    payment_day: number | null
  }
  user?: string | null
  created_at: string
}

export interface CashTotals {
  income: number
  expense: number
  balance: number
  count: number
}

export interface DueCharge {
  business_id: number
  business_name: string
  folio: string | null
  phone: string | null
  plan: PlanSlug | null
  payment_day: number | null
  concept: string
  amount: number
  quantity: number
  unit_amount: number
  last_payment_at: string | null
  next_charge_date: string
  days_overdue: number
}

export interface DueChargesResponse {
  date: string
  count: number
  total: number
  overdue_count: number
  data: DueCharge[]
}

export interface CashSummary {
  from: string
  to: string
  income: number
  expense: number
  balance: number
  count: number
  income_by_source: { fee: number; manual: number }
  months: { month: string; income: number; expense: number; balance: number }[]
  top_clients: { business_id: number; business_name: string; total: number; payments: number }[]
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
