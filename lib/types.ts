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
  newest_order: number | null
  exclude_from_newest: boolean
  plays: number
  notes: string
  created_at: string
  updated_at: string
}
