import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { extractTikTokVideoId, resolveTikTokUrl } from '@/lib/tiktok'

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET!)
}

async function requireAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin_token')?.value
  if (!token) return false
  try {
    await jwtVerify(token, getSecret())
    return true
  } catch {
    return false
  }
}

// GET /api/videos — public, optionally filtered by ?sport=slug
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport')

  let query = supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })

  if (sport) query = query.eq('sport_slug', sport)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// POST /api/videos — admin only
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { sport_name, sport_slug, notes } = body
    const plays = parseInt(body.plays) || 0

    if (!body.tiktok_url || !sport_name || !sport_slug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const resolvedUrl = await resolveTikTokUrl(body.tiktok_url)
    const tiktok_id = extractTikTokVideoId(resolvedUrl)

    if (!tiktok_id) {
      return NextResponse.json(
        {
          error:
            'Could not extract video ID from URL. Please paste the full TikTok URL (e.g. tiktok.com/@user/video/123...).',
        },
        { status: 400 }
      )
    }

    const caption = body.caption || ''

    const { data, error } = await supabaseAdmin
      .from('videos')
      .insert({
        tiktok_url: resolvedUrl,
        tiktok_id,
        caption,
        sport_name,
        sport_slug,
        plays,
        notes: notes ?? '',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
