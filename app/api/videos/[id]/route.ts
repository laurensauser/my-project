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
    const { caption, sport_name, sport_slug, notes } = body
    const plays = parseInt(body.plays) || 0

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
      caption: caption ?? '',
      sport_name,
      sport_slug,
      plays,
      notes: notes ?? '',
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

    const { data, error } = await supabaseAdmin
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/videos/:id — admin only
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { error } = await supabaseAdmin.from('videos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
