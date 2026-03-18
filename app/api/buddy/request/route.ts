import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/supabase/server'
import { supabaseAdmin } from '@/app/supabase/supabase-admin'

function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { sport_name, display_name, degree, preferred_date, preferred_time_start, preferred_time_end, session_key } = body

  if (!sport_name || !display_name || !degree || !preferred_date || !preferred_time_start || !preferred_time_end || !session_key) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Cancel any previous open request from this user for the same sport so they
  // don't accumulate stale open rows.
  await supabaseAdmin
    .from('buddy_requests')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)
    .eq('sport_name', sport_name)
    .eq('status', 'open')

  // Insert the new request
  const { data: newRequest, error: insertError } = await supabaseAdmin
    .from('buddy_requests')
    .insert({
      user_id: user.id,
      sport_name,
      display_name,
      degree,
      preferred_date,
      preferred_time_start,
      preferred_time_end,
      session_key,
      status: 'open',
    })
    .select()
    .single()

  if (insertError || !newRequest) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Insert failed' },
      { status: 500 },
    )
  }

  // Find open requests from other users on the same sport + date
  const { data: candidates } = await supabaseAdmin
    .from('buddy_requests')
    .select('id, user_id, display_name, degree, preferred_time_start, preferred_time_end')
    .eq('status', 'open')
    .eq('sport_name', sport_name)
    .eq('preferred_date', preferred_date)
    .neq('user_id', user.id)
    .neq('id', newRequest.id)
    .order('created_at', { ascending: true })

  // Find overlapping time slot
  const myStart = timeToMinutes(preferred_time_start)
  const myEnd = timeToMinutes(preferred_time_end)
  const candidate = candidates?.find((r) => {
    const cStart = timeToMinutes(r.preferred_time_start)
    const cEnd = timeToMinutes(r.preferred_time_end)
    // Overlap if one starts before the other ends and ends after the other starts
    return myStart < cEnd && myEnd > cStart
  })

  if (candidate) {
    // Record the match and update both rows atomically-ish
    await supabaseAdmin.from('buddy_matches').insert({
      request_a: newRequest.id,
      request_b: candidate.id,
    })

    await Promise.all([
      supabaseAdmin
        .from('buddy_requests')
        .update({ status: 'matched' })
        .eq('id', newRequest.id),
      supabaseAdmin
        .from('buddy_requests')
        .update({ status: 'matched' })
        .eq('id', candidate.id),
    ])

    return NextResponse.json({
      matched: true,
      buddy: {
        display_name: candidate.display_name,
        degree: candidate.degree,
        preferred_time_start: candidate.preferred_time_start,
        preferred_time_end: candidate.preferred_time_end,
      },
    })
  }

  return NextResponse.json({ matched: false })
}
