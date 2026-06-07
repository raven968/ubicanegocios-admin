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

export interface BusinessImage {
  id: number
  url: string
  order: number
}

export interface Business {
  id: number
  name: string
  slug: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  video_url: string | null
  video_orientation: 'horizontal' | 'vertical'
  tags: string[]
  active: boolean
  average_rating: number
  reviews_count: number
  images: BusinessImage[]
  categories: Category[]
  subcategories: Subcategory[]
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
  meta?: { current_page: number; last_page: number; total: number }
  links?: unknown
}
