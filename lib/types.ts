export interface Sport {
  id: string
  name: string
  slug: string
  active: boolean
  description: string
  created_at: string
}

export interface Video {
  id: string
  tiktok_url: string
  tiktok_id: string
  caption: string
  sports: Sport[]
  sport_orders: Record<string, number | null>
  featured_order: number | null
  include_in_featured: boolean
  plays: number
  notes: string
  created_at: string
  updated_at: string
}
