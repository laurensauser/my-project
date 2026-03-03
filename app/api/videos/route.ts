import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { extractTikTokVideoId, resolveTikTokUrl } from '@/lib/tiktok'
import type { Sport } from '@/lib/types'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function attachSports(raw: any) {
  const { video_sports, ...rest } = raw
  const vSports = video_sports ?? []
  return {
    ...rest,
    sports: vSports.map((vs: { sports: Sport | null }) => vs.sports).filter(Boolean),
    sport_orders: Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vSports.filter((vs: any) => vs.sports?.id).map((vs: any) => [vs.sports.id, vs.display_order ?? null])
    ),
  }
}

// GET /api/videos — public, optionally filtered by ?sport=slug
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sportSlug = searchParams.get('sport')

  let videoIds: string[] | null = null

  if (sportSlug) {
    const { data: sportData } = await supabase
      .from('sports')
      .select('id')
      .eq('slug', sportSlug)
      .single()

    if (!sportData) return NextResponse.json([])

    const { data: vsData } = await supabase
      .from('video_sports')
      .select('video_id')
      .eq('sport_id', sportData.id)

    videoIds = (vsData ?? []).map((vs: { video_id: string }) => vs.video_id)
    if (videoIds.length === 0) return NextResponse.json([])
  }

  let query = supabase
    .from('videos')
    .select('*, video_sports(display_order, sports(id, name, slug, active, description))')
    .order('created_at', { ascending: false })

  if (videoIds) query = query.in('id', videoIds)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json((data ?? []).map(attachSports))
}

// POST /api/videos — admin only
export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { sport_ids, notes, caption, exclude_from_newest } = body
    const plays = parseInt(body.plays) || 0

    if (!body.tiktok_url || !sport_ids?.length) {
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

    const { data: sportsData, error: sportsErr } = await supabaseAdmin
      .from('sports')
      .select('id, name, slug, active, description, created_at')
      .in('id', sport_ids)

    if (sportsErr || !sportsData?.length) {
      return NextResponse.json({ error: 'Invalid sport selection' }, { status: 400 })
    }

    const firstSport = sportsData[0]

    const { data: newVideo, error: insertErr } = await supabaseAdmin
      .from('videos')
      .insert({
        tiktok_url: resolvedUrl,
        tiktok_id,
        caption: caption ?? '',
        sport_name: firstSport.name,
        sport_slug: firstSport.slug,
        plays,
        notes: notes ?? '',
        exclude_from_newest: !!exclude_from_newest,
      })
      .select()
      .single()

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    const { error: vsErr } = await supabaseAdmin
      .from('video_sports')
      .insert(sport_ids.map((sport_id: string) => ({ video_id: newVideo.id, sport_id })))

    if (vsErr) return NextResponse.json({ error: vsErr.message }, { status: 500 })

    return NextResponse.json(
      { ...newVideo, sports: sportsData, sport_orders: Object.fromEntries(sportsData.map((s: Sport) => [s.id, null])) },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
