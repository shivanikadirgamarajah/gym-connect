import { NextResponse } from 'next/server'
import { createClient } from '@/app/supabase/server'
import { supabaseAdmin } from '@/app/supabase/supabase-admin'

// Returns total unread message count across all matches for the current user
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all match IDs the user is part of
  const { data: myRequests } = await supabaseAdmin
    .from('buddy_requests')
    .select('id')
    .eq('user_id', user.id)

  if (!myRequests || myRequests.length === 0) {
    return NextResponse.json({ unread: 0 })
  }

  const myRequestIds = myRequests.map((r: { id: string }) => r.id)

  const { data: matches } = await supabaseAdmin
    .from('buddy_matches')
    .select('id')
    .or(
      myRequestIds
        .map((id: string) => `request_a.eq.${id},request_b.eq.${id}`)
        .join(',')
    )

  if (!matches || matches.length === 0) {
    return NextResponse.json({ unread: 0 })
  }

  const matchIds = matches.map((m: { id: string }) => m.id)

  // Count how many conversations have at least one unread message
  const { data: unreadRows } = await supabaseAdmin
    .from('messages')
    .select('match_id')
    .in('match_id', matchIds)
    .neq('sender_id', user.id)
    .is('read_at', null)

  const uniqueChats = new Set(unreadRows?.map((r: { match_id: string }) => r.match_id) ?? [])

  return NextResponse.json({ unread: uniqueChats.size })
}
