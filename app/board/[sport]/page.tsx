import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SportFilter from '@/components/SportFilter'
import VideoGrid from '@/components/VideoGrid'
import type { Sport } from '@/lib/types'

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
    title: data ? `${data.name} — Creator Content` : 'Creator Content',
  }
}

export default async function SportBoardPage({ params }: PageProps) {
  const { sport: sportSlug } = await params

  const [{ data: sportData }, { data: activeSports }, { data: vsData }] = await Promise.all([
    supabase.from('sports').select('*').eq('slug', sportSlug).single(),
    supabase.from('sports').select('*').eq('active', true).order('name'),
    supabase
      .from('video_sports')
      .select('video_id, sports!inner(id)')
      .eq('sports.slug', sportSlug),
  ])

  if (!sportData) notFound()

  const videoIds = (vsData ?? []).map((vs: { video_id: string }) => vs.video_id)

  let videos: ReturnType<typeof Object.assign>[] = []

  if (videoIds.length > 0) {
    const { data: rawVideos } = await supabase
      .from('videos')
      .select('*, video_sports(sports(id, name, slug, active, description))')
      .in('id', videoIds)
      .order('created_at', { ascending: false })

    videos = (rawVideos ?? []).map((v) => ({
      ...v,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sports: (v.video_sports ?? []).map((vs: any) => vs.sports).filter(Boolean),
    }))
  }

  const sport = sportData as Sport

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
          <SportFilter
            sports={(activeSports as Sport[]) ?? []}
            activeSport={sportSlug}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">{sport.name}</h2>
          {sport.description && (
            <p className="text-base text-gray-300 mt-1">{sport.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {videos.length} video{videos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <VideoGrid videos={videos} />
      </main>
    </div>
  )
}
