import { supabase } from '@/lib/supabase'
import SportFilter from '@/components/SportFilter'
import VideoGrid from '@/components/VideoGrid'
import type { Video, Sport } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  const [{ data: videos }, { data: sports }] = await Promise.all([
    supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('sports').select('*').order('name'),
  ])

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 z-40 bg-gray-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white tracking-tight">
              🎬 Influencer Board
            </h1>
            <a
              href="/admin"
              className="text-xs text-gray-600 hover:text-gray-400 transition"
            >
              Admin
            </a>
          </div>
          <SportFilter sports={(sports as Sport[]) ?? []} activeSport={null} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <VideoGrid videos={(videos as Video[]) ?? []} />
      </main>
    </div>
  )
}
