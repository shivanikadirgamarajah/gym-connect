import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/supabase/server'
import { supabaseAdmin } from '@/app/supabase/supabase-admin'
import {
  findMatches,
  type BuddyRequest,
} from '@/lib/matching'


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

  // Rate limit: max 4 requests per sport per day
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count: todayCount } = await supabaseAdmin
    .from('buddy_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('sport_name', sport_name)
    .gte('created_at', todayStart.toISOString())

  if ((todayCount ?? 0) >= 6) {
    return NextResponse.json(
      { error: 'You exceeded the maximum number of requests for this sport today. Try again tomorrow!' },
      { status: 429 },
    )
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
    .in('status', ['open', 'matched'])
    .eq('sport_name', sport_name)
    .eq('preferred_date', preferred_date)
    .neq('user_id', user.id)
    .neq('id', newRequest.id)
    .order('created_at', { ascending: true })


  // Convert the new Supabase request to our matching format.
  const myRequest: BuddyRequest = {
    id: newRequest.id,
    userId: user.id,
    sport: sport_name,
    date: preferred_date,
    startTime: preferred_time_start,
    endTime: preferred_time_end,
  }

  // Convert Supabase candidate rows.
  const possibleBuddies: BuddyRequest[] = (
    candidates ?? []
  ).map((candidate) => ({
    id: candidate.id,
    userId: candidate.user_id,
    sport: sport_name,
    date: preferred_date,
    startTime: candidate.preferred_time_start,
    endTime: candidate.preferred_time_end,
  }))

  // Require 15 minutes of overlap.
  // Remove duplicate students and rank by overlap.
  const rankedMatches = findMatches(
    myRequest,
    possibleBuddies,
    15
  )

  // Keep the original database row objects.
  const candidateById = new Map(
    (candidates ?? []).map((candidate) => [
      candidate.id,
      candidate,
    ])
  )

  const overlapping = rankedMatches.flatMap(
    ({ request }) => {
      const candidate = candidateById.get(request.id)
      return candidate ? [candidate] : []
    }
  )

  if (overlapping.length > 0) {
    // Create a match with every overlapping candidate
    await supabaseAdmin.from('buddy_matches').insert(
      overlapping.map((c) => ({ request_a: newRequest.id, request_b: c.id }))
    )

    await Promise.all([
      supabaseAdmin
        .from('buddy_requests')
        .update({ status: 'matched' })
        .eq('id', newRequest.id),
      ...overlapping.map((c) =>
        supabaseAdmin
          .from('buddy_requests')
          .update({ status: 'matched' })
          .eq('id', c.id)
      ),
    ])

    return NextResponse.json({
      matched: true,
      buddies: overlapping.map((c) => ({
        display_name: c.display_name,
        degree: c.degree,
        preferred_time_start: c.preferred_time_start,
        preferred_time_end: c.preferred_time_end,
      })),
    })
  }

  return NextResponse.json({ matched: false })
}
