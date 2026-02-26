'use client'

import { useRef } from 'react'
import type { Video } from '@/lib/types'
import { formatCount } from '@/lib/tiktok'
import TikTokPlayer, { type TikTokPlayerHandle } from './TikTokPlayer'

interface VideoCardProps {
  video: Video
  adminControls?: React.ReactNode
}

export default function VideoCard({ video, adminControls }: VideoCardProps) {
  const playerRef = useRef<TikTokPlayerHandle>(null)

  const handleReplay = () => playerRef.current?.replay()

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden flex flex-col border border-gray-800">
      <TikTokPlayer
        ref={playerRef}
        videoId={video.tiktok_id}
        caption={video.caption}
      />

      {/* Action bar — sits directly below the video, always visible */}
      <div className="flex border-t border-gray-700/50">
        <button
          onClick={handleReplay}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
          Replay
        </button>
        <a
          href={video.tiktok_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-colors border-l border-gray-700/50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Post
        </a>
      </div>

      {/* Card info */}
      <div className="p-4 flex flex-col gap-3">
        {video.caption && (
          <p className="text-sm text-white leading-snug">{video.caption}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="shrink-0 text-xs bg-purple-600/20 text-purple-300 border border-purple-600/30 px-2 py-0.5 rounded-full">
            {video.sport_name}
          </span>
          {video.plays > 0 && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              {formatCount(video.plays)} plays
            </span>
          )}
        </div>

        {video.notes && (
          <p className="text-xs text-gray-400 leading-relaxed">{video.notes}</p>
        )}

        {adminControls && <div>{adminControls}</div>}
      </div>
    </div>
  )
}
