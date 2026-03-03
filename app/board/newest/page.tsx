import { supabase } from '@/lib/supabase'
import SportFilter from '@/components/SportFilter'
import VideoGrid from '@/components/VideoGrid'
import type { Sport } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function NewestPage() {
  const [{ data: rawVideos }, { data: sports }, { data: settings }] = await Promise.all([
    supabase
      .from('videos')
      .select('*, video_sports(sports(id, name, slug, active, description))')
      .eq('exclude_from_newest', false)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('sports').select('*').eq('active', true).order('name'),
    supabase.from('site_settings').select('newest_description').single(),
  ])

  const videos = (rawVideos ?? []).map((v) => ({
    ...v,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sports: (v.video_sports ?? []).map((vs: any) => vs.sports).filter(Boolean),
  }))

  const description = settings?.newest_description ?? ''

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
          <SportFilter sports={(sports as Sport[]) ?? []} activeSport="newest" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Newest</h2>
          {description && (
            <p className="text-base text-gray-300 mt-1">{description}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">The 10 most recently added videos</p>
        </div>
        <VideoGrid videos={videos} />
      </main>
    </div>
  )
}
