/**
 * Extract TikTok video ID from various URL formats.
 * Returns null if the URL cannot be parsed.
 */
export function extractTikTokVideoId(url: string): string | null {
  // Standard: https://www.tiktok.com/@username/video/7123456789012345678
  const standardMatch = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/)
  if (standardMatch) return standardMatch[1]

  // Alternate format with query params already handled by regex above
  return null
}

/**
 * Resolve short TikTok URLs (vm.tiktok.com, tiktok.com/t/) by following redirects.
 * Falls back to the original URL if resolution fails.
 */
export async function resolveTikTokUrl(url: string): Promise<string> {
  const isShort =
    url.includes('vm.tiktok.com') ||
    url.match(/tiktok\.com\/t\//) !== null

  if (!isShort) return url

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
    })
    return res.url || url
  } catch {
    // HEAD blocked — try GET but abort quickly
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return res.url || url
    } catch {
      return url
    }
  }
}


export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}
