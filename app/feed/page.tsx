import { redirect } from 'next/navigation'
import { createClient } from '@/app/supabase/server'
import LogoutButton from '@/app/components/LogoutButton'

type Session = {
  session_key: string
  sport_name: string | null
  session_date: string
  start_time: string
  end_time: string
  location: string | null
  spots_available: number | null
}

function formatDate(input: string) {
  const parsed = new Date(`${input}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return input
  return parsed.toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default async function FeedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('dropin_sessions')
    .select('session_key, sport_name, session_date, start_time, end_time, location, spots_available')
    .eq('is_active', true)
    .order('session_date', { ascending: true })

  const sessions: Session[] = data ?? []
  const sessionsBySport = sessions.reduce<Record<string, Session[]>>((acc, session) => {
    const sport = session.sport_name?.trim() || 'Other Sports'
    if (!acc[sport]) {
      acc[sport] = []
    }
    acc[sport].push(session)
    return acc
  }, {})

  const sportEntries = Object.entries(sessionsBySport).sort(([a], [b]) =>
    a.localeCompare(b)
  )

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">York Drop-In Feed</h1>
        <LogoutButton />
      </div>

      <p className="mt-4">You are logged in as {user.email}</p>

      {error ? (
        <p className="mt-4 text-sm text-red-600">Failed to load sessions: {error.message}</p>
      ) : (
        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">Active Sports</h2>
          {sportEntries.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sportEntries.map(([sport, sportSessions]) => (
                <article
                  key={sport}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold">{sport}</h3>
                    <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white">
                      {sportSessions.length} session{sportSessions.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-2">
                    {sportSessions.map((session) => (
                      <li key={session.session_key} className="rounded-md bg-zinc-50 p-3">
                        <p className="text-sm font-medium">
                          {formatDate(session.session_date)} {session.start_time} - {session.end_time}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">
                          {session.location ?? 'Location TBA'}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {typeof session.spots_available === 'number'
                            ? `${session.spots_available} spots available`
                            : 'Spots unavailable'}
                        </p>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No active sessions yet.</p>
          )}
        </section>
      )}
    </main>
  )
}
