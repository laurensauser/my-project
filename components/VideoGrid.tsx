'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import VideoCard from './VideoCard'
import type { Video } from '@/lib/types'

interface VideoGridProps {
  videos: Video[]
  adminControls?: (video: Video) => React.ReactNode
  draggable?: boolean
  onDragEnd?: (reorderedVideos: Video[]) => void
}

export default function VideoGrid({ videos, adminControls, draggable, onDragEnd }: VideoGridProps) {
  const [localVideos, setLocalVideos] = useState(videos)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const draggedIdRef = useRef<string | null>(null)
  const localVideosRef = useRef(localVideos)

  useEffect(() => { localVideosRef.current = localVideos }, [localVideos])

  // Sync from props whenever videos change and we're not mid-drag
  useEffect(() => {
    if (!draggedIdRef.current) setLocalVideos(videos)
  }, [videos])

  const handleDragStart = useCallback((id: string) => {
    draggedIdRef.current = id
    setDraggingId(id)
  }, [])

  const handleDragEnter = useCallback((targetId: string) => {
    const draggedId = draggedIdRef.current
    if (!draggedId || draggedId === targetId) return
    setLocalVideos((prev) => {
      const oldIndex = prev.findIndex((v) => v.id === draggedId)
      const newIndex = prev.findIndex((v) => v.id === targetId)
      if (oldIndex === -1 || newIndex === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(oldIndex, 1)
      next.splice(newIndex, 0, moved)
      return next
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    const reordered = localVideosRef.current
    draggedIdRef.current = null
    setDraggingId(null)
    onDragEnd?.(reordered)
  }, [onDragEnd])

  if (localVideos.length === 0) {
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
      {localVideos.map((video) => {
        const isDragging = draggingId === video.id

        const controls = adminControls
          ? draggable
            ? (
              <div>
                <div className="flex items-center justify-center gap-2 py-1.5 mb-2 rounded-lg bg-gray-800/60 select-none cursor-grab active:cursor-grabbing">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 16 16">
                    <circle cx="5" cy="4" r="1.5" />
                    <circle cx="5" cy="8" r="1.5" />
                    <circle cx="5" cy="12" r="1.5" />
                    <circle cx="11" cy="4" r="1.5" />
                    <circle cx="11" cy="8" r="1.5" />
                    <circle cx="11" cy="12" r="1.5" />
                  </svg>
                  <span className="text-xs text-gray-500">Drag to reorder</span>
                </div>
                {adminControls(video)}
              </div>
            )
            : adminControls(video)
          : undefined

        return (
          <div
            key={video.id}
            className="break-inside-avoid mb-4"
            draggable={!!draggable}
            onDragStart={draggable ? () => handleDragStart(video.id) : undefined}
            onDragEnter={draggable ? () => handleDragEnter(video.id) : undefined}
            onDragEnd={draggable ? handleDragEnd : undefined}
            onDragOver={draggable ? (e) => e.preventDefault() : undefined}
            style={isDragging ? { opacity: 0.4 } : undefined}
          >
            <VideoCard video={video} adminControls={controls} />
          </div>
        )
      })}
    </div>
  )
}
