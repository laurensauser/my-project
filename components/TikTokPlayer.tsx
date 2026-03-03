'use client'

import { useState, useRef, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react'

export interface TikTokPlayerHandle {
  replay: () => void
}

interface TikTokPlayerProps {
  videoId: string
  caption: string
}

const TikTokPlayer = forwardRef<TikTokPlayerHandle, TikTokPlayerProps>(
  function TikTokPlayer({ videoId, caption }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
    const [playing, setPlaying] = useState(false)

    const src = `https://www.tiktok.com/embed/v2/${videoId}?loop=1&rel=0&hideCaption=1&hideControls=1&autoplay=1`

    useEffect(() => {
      setPlaying(false)
      setThumbnailUrl(null)
      // Clear iframe src when videoId changes
      if (iframeRef.current) iframeRef.current.src = ''
      fetch(`https://www.tiktok.com/oembed?url=https://www.tiktok.com/video/${videoId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.thumbnail_url) setThumbnailUrl(data.thumbnail_url)
          else handlePlay()
        })
        .catch(() => handlePlay())
    }, [videoId])

    const handlePlay = useCallback(() => {
      setPlaying(true)
      const iframe = iframeRef.current
      if (iframe) iframe.src = src
    }, [src])

    const replay = useCallback(() => {
      setPlaying(true)
      const iframe = iframeRef.current
      if (!iframe) return
      iframe.src = ''
      requestAnimationFrame(() => {
        if (iframe) iframe.src = src
      })
    }, [src])

    useImperativeHandle(ref, () => ({ replay }), [replay])

    return (
      <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
        {/* Iframe — src managed imperatively, never set via React prop */}
        <iframe
          ref={iframeRef}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          loading="lazy"
          scrolling="no"
          style={{ border: 'none', overflow: 'hidden' }}
          title={caption || 'TikTok video'}
        />

        {/* Thumbnail overlay — shown until user clicks play */}
        {!playing && thumbnailUrl && (
          <button
            onClick={handlePlay}
            className="absolute inset-0 w-full h-full group"
            aria-label="Play video"
          >
            <img
              src={thumbnailUrl}
              alt={caption || 'TikTok video'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </button>
        )}

        {/* Loading state — while oEmbed fetch is in flight */}
        {!playing && !thumbnailUrl && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gray-700 border-t-gray-400 rounded-full animate-spin" />
          </div>
        )}
      </div>
    )
  }
)

export default TikTokPlayer
