import VideoCard from './VideoCard'
import type { Video } from '@/lib/types'

interface VideoGridProps {
  videos: Video[]
  adminControls?: (video: Video) => React.ReactNode
}

export default function VideoGrid({ videos, adminControls }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="text-5xl mb-4">🎬</div>
        <p className="text-gray-400 text-lg font-medium">No videos here yet</p>
        <p className="text-gray-600 text-sm mt-1">
          Add some TikTok videos in the admin panel to get started
        </p>
      </div>
    )
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-4">
      {videos.map((video) => (
        <div key={video.id} className="break-inside-avoid mb-4">
          <VideoCard
            video={video}
            adminControls={adminControls?.(video)}
          />
        </div>
      ))}
    </div>
  )
}
