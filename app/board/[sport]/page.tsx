import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SportFilter from '@/components/SportFilter'
import VideoGrid from '@/components/VideoGrid'
import type { Video, Sport } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ sport: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { sport } = await params
  const { data } = await supabase
    .from('sports')
    .select('name')
    .eq('slug', sport)
    .single()

  return {
    title: data ? `${data.name} — Influencer Board` : 'Influencer Board',
  }
}

export default async function SportBoardPage({ params }: PageProps) {
  const { sport: sportSlug } = await params

  const [{ data: sportData }, { data: videos }, { data: sports }] =
    await Promise.all([
      supabase.from('sports').select('*').eq('slug', sportSlug).single(),
      supabase
        .from('videos')
        .select('*')
        .eq('sport_slug', sportSlug)
        .order('created_at', { ascending: false }),
      supabase.from('sports').select('*').order('name'),
    ])

  if (!sportData) notFound()

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
          <SportFilter
            sports={(sports as Sport[]) ?? []}
            activeSport={sportSlug}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">
            {(sportData as Sport).name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {videos?.length ?? 0} video{(videos?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <VideoGrid videos={(videos as Video[]) ?? []} />
      </main>
    </div>
  )
}
