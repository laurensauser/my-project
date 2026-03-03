import { supabase } from '@/lib/supabase'
import SportFilter from '@/components/SportFilter'
import VideoGrid from '@/components/VideoGrid'
import type { Sport } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  const [{ data: rawVideos }, { data: sports }] = await Promise.all([
    supabase
      .from('videos')
      .select('*, video_sports(display_order, sports(id, name, slug, active, description))')
      .order('created_at', { ascending: false }),
    supabase.from('sports').select('*').order('display_order', { nullsFirst: false }).order('name'),
  ])

  const videos = (rawVideos ?? []).map((v) => ({
    ...v,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sports: (v.video_sports ?? []).map((vs: any) => vs.sports).filter(Boolean),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sport_orders: Object.fromEntries((v.video_sports ?? []).filter((vs: any) => vs.sports?.id).map((vs: any) => [vs.sports.id, vs.display_order ?? null])),
  }))

  const allSports = (sports as Sport[]) ?? []
  const activeSports = allSports.filter((s) => s.active)

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 z-40 bg-gray-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white tracking-tight">
              🎬 Creator Content
            </h1>
            <a
              href="/admin"
              className="text-xs text-gray-600 hover:text-gray-400 transition"
            >
              Admin
            </a>
          </div>
          <SportFilter sports={activeSports} activeSport={null} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <VideoGrid videos={videos} />
      </main>
    </div>
  )
}
