import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/supabase/server'
import { supabaseAdmin } from '@/app/supabase/supabase-admin'

// Mark all messages in a match as read (messages not sent by current user)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { match_id } = body

  if (!match_id) {
    return NextResponse.json({ error: 'match_id is required' }, { status: 400 })
  }

  // Verify user is part of this match
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

  // Mark all messages from the other person as read
  await supabaseAdmin
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('match_id', match_id)
    .neq('sender_id', user.id)
    .is('read_at', null)

  return NextResponse.json({ success: true })
}
