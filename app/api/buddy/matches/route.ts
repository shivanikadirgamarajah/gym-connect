import { NextResponse } from 'next/server'
import { createClient } from '@/app/supabase/server'
import { supabaseAdmin } from '@/app/supabase/supabase-admin'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Get this user's buddy requests
  const { data: myRequests, error: myRequestsError } = await supabaseAdmin
    .from('buddy_requests')
    .select('id')
    .eq('user_id', user.id)

  if (myRequestsError || !myRequests || myRequests.length === 0) {
    return NextResponse.json({ conversations: [] })
  }

  const myRequestIds = myRequests.map((r: { id: string }) => r.id)

  // 2. Find matches involving any of my request ids
  const { data: matches, error: matchesError } = await supabaseAdmin
    .from('buddy_matches')
    .select('id, request_a, request_b, created_at')
    .or(
      myRequestIds
        .map((id: string) => `request_a.eq.${id},request_b.eq.${id}`)
        .join(',')
    )

  if (matchesError || !matches || matches.length === 0) {
    return NextResponse.json({ conversations: [] })
  }

  // 3. Determine the "other" request id for each match
  const matchPairs = matches
    .map((match: { id: string; request_a: string; request_b: string }) => {
      if (myRequestIds.includes(match.request_a)) {
        return { matchId: match.id, myId: match.request_a, otherId: match.request_b }
      } else {
        return { matchId: match.id, myId: match.request_b, otherId: match.request_a }
      }
    })
    .filter((pair: { matchId: string; myId: string; otherId: string }) => pair.myId && pair.otherId)

  // 4. Fetch all involved buddy request rows
  const allRequestIds = [
    ...new Set([
      ...matchPairs.map((p: { myId: string }) => p.myId),
      ...matchPairs.map((p: { otherId: string }) => p.otherId),
    ]),
  ]

  const { data: allRequests, error: allRequestsError } = await supabaseAdmin
    .from('buddy_requests')
    .select(
      'id, user_id, display_name, degree, sport_name, preferred_date, preferred_time_start, preferred_time_end, status'
    )
    .in('id', allRequestIds)

  if (allRequestsError || !allRequests) {
    return NextResponse.json({ conversations: [] })
  }

  // 5a. Get unread counts per match
  const matchIds = matchPairs.map((p: { matchId: string }) => p.matchId)
  const { data: unreadRows } = await supabaseAdmin
    .from('messages')
    .select('match_id')
    .in('match_id', matchIds)
    .neq('sender_id', user.id)
    .is('read_at', null)

  const unreadByMatch: Record<string, number> = {}
  for (const row of unreadRows ?? []) {
    unreadByMatch[row.match_id] = (unreadByMatch[row.match_id] ?? 0) + 1
  }

  // 5b. Get the latest message timestamp per match for sorting
  const { data: latestMsgRows } = await supabaseAdmin
    .from('messages')
    .select('match_id, created_at')
    .in('match_id', matchIds)
    .order('created_at', { ascending: false })

  const latestMsgByMatch: Record<string, string> = {}
  for (const row of latestMsgRows ?? []) {
    if (!latestMsgByMatch[row.match_id]) {
      latestMsgByMatch[row.match_id] = row.created_at
    }
  }

  // Build a map of match created_at for fallback sorting
  const matchCreatedAt: Record<string, string> = {}
  for (const m of matches) {
    matchCreatedAt[m.id] = m.created_at
  }

  // 6. Build conversation objects and deduplicate by person + time
  const seen = new Set<string>()
  const conversations = matchPairs
    .map((pair: { matchId: string; myId: string; otherId: string }) => {
      const other = allRequests.find((r: { id: string }) => r.id === pair.otherId)
      if (!other) return null

      // Deduplicate by other user + sport + date
      const dedupeKey = `${other.user_id}_${other.sport_name}_${other.preferred_date}`
      if (seen.has(dedupeKey)) return null
      seen.add(dedupeKey)

      return {
        id: other.id,
        match_id: pair.matchId,
        other_user_id: other.user_id,
        name: other.display_name,
        degree: other.degree,
        sport: other.sport_name,
        lastMessage: `Matched for ${other.sport_name} on ${other.preferred_date}`,
        time: `${other.preferred_time_start} - ${other.preferred_time_end}`,
        unread: unreadByMatch[pair.matchId] ?? 0,
        avatar: other.display_name?.charAt(0).toUpperCase() || '?',
      }
    })
    .filter(Boolean)

  // Sort: unread conversations first, then by latest message time (newest first),
  // then by match creation time (newest first) if no messages
  conversations.sort((a: any, b: any) => {
    // Unread first
    if (a.unread > 0 && b.unread === 0) return -1
    if (a.unread === 0 && b.unread > 0) return 1

    // Then by latest message time or match creation time (newest first)
    const aTime = latestMsgByMatch[a.match_id] ?? matchCreatedAt[a.match_id] ?? ''
    const bTime = latestMsgByMatch[b.match_id] ?? matchCreatedAt[b.match_id] ?? ''
    return bTime.localeCompare(aTime)
  })

  return NextResponse.json({ conversations })
}
