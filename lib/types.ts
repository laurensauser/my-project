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
  exclude_from_newest: boolean
  plays: number
  notes: string
  created_at: string
  updated_at: string
}
