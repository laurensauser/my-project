import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
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

interface RouteParams {
  params: Promise<{ id: string }>
}

// PUT /api/videos/:id — admin only
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { caption, sport_ids, notes, exclude_from_newest } = body
    const plays = parseInt(body.plays) || 0

    if (!sport_ids?.length) {
      return NextResponse.json({ error: 'At least one sport is required' }, { status: 400 })
    }

    const { data: sportsData, error: sportsErr } = await supabaseAdmin
      .from('sports')
      .select('id, name, slug, active, description, created_at')
      .in('id', sport_ids)

    if (sportsErr || !sportsData?.length) {
      return NextResponse.json({ error: 'Invalid sport selection' }, { status: 400 })
    }

    const firstSport = sportsData[0]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
      caption: caption ?? '',
      sport_name: firstSport.name,
      sport_slug: firstSport.slug,
      plays,
      notes: notes ?? '',
      exclude_from_newest: !!exclude_from_newest,
    }

    if (body.tiktok_url) {
      const resolvedUrl = await resolveTikTokUrl(body.tiktok_url)
      const tiktok_id = extractTikTokVideoId(resolvedUrl)
      if (!tiktok_id) {
        return NextResponse.json(
          { error: 'Could not extract video ID from URL' },
          { status: 400 }
        )
      }
      updates.tiktok_url = resolvedUrl
      updates.tiktok_id = tiktok_id
    }

    const { data: updatedVideo, error: updateErr } = await supabaseAdmin
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    await supabaseAdmin.from('video_sports').delete().eq('video_id', id)

    const { error: vsErr } = await supabaseAdmin
      .from('video_sports')
      .insert(sport_ids.map((sport_id: string) => ({ video_id: id, sport_id })))

    if (vsErr) return NextResponse.json({ error: vsErr.message }, { status: 500 })

    return NextResponse.json({ ...updatedVideo, sports: sportsData })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/videos/:id — admin only
// video_sports rows are deleted automatically via ON DELETE CASCADE
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { error } = await supabaseAdmin.from('videos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
