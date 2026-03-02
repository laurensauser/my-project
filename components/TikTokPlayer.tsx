'use client'

import { useRef, useImperativeHandle, forwardRef, useCallback } from 'react'

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
    const src = `https://www.tiktok.com/embed/v2/${videoId}?loop=1&rel=0&hideCaption=1`

    const replay = useCallback(() => {
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
        <iframe
          ref={iframeRef}
          src={src}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          loading="lazy"
          scrolling="no"
          style={{ border: 'none', overflow: 'hidden' }}
          title={caption || 'TikTok video'}
        />
      </div>
    )
  }
)

export default TikTokPlayer
