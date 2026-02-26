export interface Video {
  id: string
  tiktok_url: string
  tiktok_id: string
  caption: string
  sport_name: string
  sport_slug: string
  plays: number
  notes: string
  created_at: string
  updated_at: string
}

export interface Sport {
  id: string
  name: string
  slug: string
  created_at: string
}
