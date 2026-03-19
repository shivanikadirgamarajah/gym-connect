import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/supabase/server'
import { supabaseAdmin } from '@/app/supabase/supabase-admin'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const matchId = request.nextUrl.searchParams.get('match_id')
  if (!matchId) {
    return NextResponse.json({ error: 'match_id is required' }, { status: 400 })
  }

  // Verify the user is part of this match
  const { data: match } = await supabaseAdmin
    .from('buddy_matches')
    .select('id, request_a, request_b')
    .eq('id', matchId)
    .single()

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const { data: myRequests } = await supabaseAdmin
    .from('buddy_requests')
    .select('id')
    .eq('user_id', user.id)

  const myRequestIds = myRequests?.map((r: { id: string }) => r.id) ?? []
  if (!myRequestIds.includes(match.request_a) && !myRequestIds.includes(match.request_b)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: messages, error } = await supabaseAdmin
    .from('messages')
    .select('id, match_id, sender_id, content, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ messages: messages ?? [], current_user_id: user.id })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { match_id, content } = body

  if (!match_id || !content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'match_id and content are required' }, { status: 400 })
  }

  // Verify the user is part of this match
  const { data: match } = await supabaseAdmin
    .from('buddy_matches')
    .select('id, request_a, request_b')
    .eq('id', match_id)
    .single()

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const { data: myRequests } = await supabaseAdmin
    .from('buddy_requests')
    .select('id')
    .eq('user_id', user.id)

  const myRequestIds = myRequests?.map((r: { id: string }) => r.id) ?? []
  if (!myRequestIds.includes(match.request_a) && !myRequestIds.includes(match.request_b)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: message, error } = await supabaseAdmin
    .from('messages')
    .insert({
      match_id: match_id,
      sender_id: user.id,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message })
}
