import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

// GET /api/settings — public
export async function GET() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('newest_description')
    .single()

  if (error) return NextResponse.json({ newest_description: '' })
  return NextResponse.json(data)
}

// PATCH /api/settings — admin only
export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { newest_description } = await request.json()

    if (typeof newest_description !== 'string') {
      return NextResponse.json({ error: 'newest_description must be a string' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .update({ newest_description })
      .eq('id', 1)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
