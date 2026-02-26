'use client'

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

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

    // Expose replay() so VideoCard can call it directly without a key remount.
    // Wiping then restoring src is instant — no React re-render overhead.
    useImperativeHandle(ref, () => ({
      replay() {
        const iframe = iframeRef.current
        if (!iframe) return
        iframe.src = ''
        requestAnimationFrame(() => {
          if (iframe) iframe.src = src
        })
      },
    }), [src])

    // Fallback: listen for postMessage end events from TikTok's player
    useEffect(() => {
      const iframe = iframeRef.current

      const handleMessage = (event: MessageEvent) => {
        if (!iframe || event.source !== iframe.contentWindow) return
        const data = event.data
        if (!data || typeof data !== 'object') return

        const ended =
          data.event === 'ended' ||
          data.type === 'ended' ||
          data.status === 'ended' ||
          data.eventName === 'onPlaybackComplete' ||
          data.eventName === 'tiktok_player_ended' ||
          (data.type === 'PLAYER_EVENT' && data.event === 'ended') ||
          (data.type === 'onStateChange' && data.state === 'ended')

        if (ended) {
          iframe.src = ''
          requestAnimationFrame(() => { if (iframe) iframe.src = src })
        }
      }

      window.addEventListener('message', handleMessage)
      return () => window.removeEventListener('message', handleMessage)
    }, [src])

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
