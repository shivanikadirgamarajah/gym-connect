'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/supabase/client'

type Conversation = {
  id: string
  name: string
  degree: string
  sport: string
  lastMessage: string
  time: string
  unread: number
  avatar: string
}

type BuddyRequest = {
  id: string
  user_id: string
  display_name: string
  degree: string
  sport_name: string
  preferred_date: string
  preferred_time_start: string
  preferred_time_end: string
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to convert time string to minutes
  function timeToMinutes(time) {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m ?? 0);
  }

  useEffect(() => {
    async function fetchMatches() {
      const supabase = createClient();
      const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
      if (!user) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // 1. Get this user's own buddy requests
      const { data: myRequests, error: myRequestsError } = await supabase
        .from('buddy_requests')
        .select(
          'id, user_id, display_name, degree, sport_name, preferred_date, preferred_time_start, preferred_time_end, status'
        )
        .eq('user_id', user.id);

      console.log('myRequests', myRequests);

      if (myRequestsError) {
        console.error('Error fetching my requests:', myRequestsError);
        setConversations([]);
        setLoading(false);
        return;
      }

      if (!myRequests || myRequests.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const myRequestIds = myRequests.map((r) => r.id);

      // 2. Find matches involving any of my request ids (from buddy_matches)
      const { data: matches, error: matchesError } = await supabase
        .from('buddy_matches')
        .select('id, request_a, request_b, created_at')
        .or(
          myRequestIds
            .map((id) => `request_a.eq.${id},request_b.eq.${id}`)
            .join(',')
        );

      console.log('matches', matches);

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        setConversations([]);
        setLoading(false);
        return;
      }

      if (!matches || matches.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // 3. For each match, get both your request and the other request
      const matchPairs = matches
        .map((match) => {
          if (myRequestIds.includes(match.request_a)) {
            return { myId: match.request_a, otherId: match.request_b };
          } else {
            return { myId: match.request_b, otherId: match.request_a };
          }
        })
        .filter((pair) => pair.myId && pair.otherId);

      console.log('matchPairs', matchPairs);

      // 4. Fetch all involved buddy request rows
      const allRequestIds = [
        ...new Set([
          ...matchPairs.map((p) => p.myId),
          ...matchPairs.map((p) => p.otherId),
        ]),
      ];
      const { data: allRequests, error: allRequestsError } = await supabase
        .from('buddy_requests')
        .select(
          'id, user_id, display_name, degree, sport_name, preferred_date, preferred_time_start, preferred_time_end, status'
        )
        .in('id', allRequestIds);

      console.log('allRequests', allRequests);

      if (allRequestsError) {
        console.error('Error fetching buddy requests:', allRequestsError);
        setConversations([]);
        setLoading(false);
        return;
      }

      // 5. For each match pair, show all matches regardless of status, sport, date, or time overlap
      const convs: Conversation[] = matchPairs
        .map((pair) => {
          const mine = allRequests.find((r) => r.id === pair.myId);
          const other = allRequests.find((r) => r.id === pair.otherId);
          if (!mine || !other) return null;
          return {
            id: other.id,
            name: other.display_name,
            degree: other.degree,
            sport: other.sport_name,
            lastMessage: `Matched for ${other.sport_name} on ${other.preferred_date}`,
            time: `${other.preferred_time_start} - ${other.preferred_time_end}`,
            unread: 0,
            avatar: other.display_name?.charAt(0).toUpperCase() || '?',
          };
        })
        .filter(Boolean);

      console.log('convs', convs);

      setConversations(convs);
      setLoading(false);
    }
    fetchMatches();
  }, []);

  return (
    <main className="min-h-screen w-full text-zinc-900">
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-red-950 bg-red-900/95 p-4 text-red-50 backdrop-blur md:p-5">
        <div className="flex items-center gap-3">
          <Link
            href="/feed"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-red-200 transition hover:bg-red-800"
            aria-label="Back to feed"
          >
            Back
          </Link>
          <h1 className="text-2xl font-semibold md:text-3xl">Messages</h1>
        </div>
        <span className="text-sm text-red-200">Your buddy conversations</span>
      </div>

      <div className="mx-auto max-w-2xl p-4 md:p-6">
        <ul className="space-y-2">
          {loading ? (
            <li className="text-center text-sm text-zinc-500">Loading...</li>
          ) : conversations.length > 0 ? (
            conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  type="button"
                  className="surface-card fade-rise flex w-full items-center gap-4 rounded-2xl p-4 text-left transition hover:shadow-md"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-red-900 text-sm font-semibold text-white">
                    {conv.avatar}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold text-zinc-900">{conv.name}</span>
                      <span className="flex-shrink-0 text-xs text-zinc-400">{conv.time}</span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                        {conv.sport}
                      </span>
                      <span className="truncate text-xs text-zinc-500">{conv.degree}</span>
                    </div>

                    <p className="mt-1 truncate text-sm text-zinc-800">{conv.lastMessage}</p>
                  </div>
                </button>
              </li>
            ))
          ) : (
            <li className="text-center text-sm text-zinc-500">No matches found yet.</li>
          )}
        </ul>
      </div>
    </main>
  )
}