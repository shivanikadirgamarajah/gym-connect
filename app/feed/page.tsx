import { redirect } from 'next/navigation'
import { createClient } from '@/app/supabase/server'
import FeedHeader from '@/app/components/FeedHeader'
import LogoutButton from '@/app/components/LogoutButton'
import MessagesButton from '@/app/components/MessagesButton'
import SportCard, { hasSportBackground } from '@/app/components/SportCard'
import GetBuddyButton from './GetBuddyButton'

type Session = {
  session_key: string
  sport_name: string | null
  source_url: string | null
}

function isYorkEmail(email: string | undefined) {
  const domain = email?.trim().toLowerCase().split('@')[1] ?? ''
  return domain === 'yorku.ca' || domain.endsWith('.yorku.ca')
}

function getDetailsLink(session: Session) {
  const sourceUrl = session.source_url
  if (sourceUrl && sourceUrl.includes('/Program/GetProgramDetails?courseId=')) {
    return sourceUrl
  }

  const fromSource = sourceUrl?.match(/[?&]programID=([0-9a-f-]+)/i)?.[1]
  if (fromSource) {
    return `https://reconline.yorkulions.ca/Program/GetProgramDetails?courseId=${fromSource}`
  }

  const fromKey = session.session_key.match(/^([0-9a-f-]{36})/i)?.[1]
  if (fromKey) {
    return `https://reconline.yorkulions.ca/Program/GetProgramDetails?courseId=${fromKey}`
  }

  return sourceUrl
}

export default async function FeedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isYorkEmail(user.email)) {
    redirect('/login')
  }

  const meta = user.user_metadata
  if (!meta?.display_name || !meta?.degree) {
    redirect('/complete-profile')
  }

  const { data, error } = await supabase
    .from('dropin_sessions')
    .select('session_key, sport_name, source_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const sessions: Session[] = data ?? []
  const sessionsBySport = sessions.reduce<Record<string, Session[]>>((acc, session) => {
    const sport = session.sport_name?.trim() || 'Other Sports'
    if (!acc[sport]) {
      acc[sport] = []
    }
    acc[sport].push(session)
    return acc
  }, {})

  const sportNameSorter = new Intl.Collator('en-CA', { sensitivity: 'base' })
  const sportEntries = Object.entries(sessionsBySport).sort(([a], [b]) =>
    sportNameSorter.compare(a, b)
  )

  return (
    <main className="min-h-screen w-full p-6 text-[var(--foreground)] md:p-8">
      <FeedHeader description="find your partner to play a sport!" sticky>
        <MessagesButton />
        <LogoutButton />
      </FeedHeader>

      <p className="mt-4 text-sm ink-soft">Signed in as {user.email}</p>

      {error ? (
        <p className="mt-4 text-sm text-red-600">Failed to load sessions: {error.message}</p>
      ) : (
        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">Choose a sport to play with a buddy...</h2>
          {sportEntries.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sportEntries.map(([sport, sportSessions], idx) => (
                <SportCard key={sport} sport={sport} index={idx}>
                  <div className="flex items-start gap-2">
                    <h3 className="text-xl font-semibold">{sport}</h3>
                  </div>

                  <ul className="mt-5 space-y-3">
                    {sportSessions.map((session) => (
                      <li
                        key={session.session_key}
                        className={`rounded-xl border bg-[var(--surface)] p-4 ${hasSportBackground(sport) ? 'border-white/40' : 'border-[var(--line)]'}`}
                      >
                        <div className="mt-1 flex w-full items-center justify-between gap-6">
                          {getDetailsLink(session) ? (
                            <a
                              className="inline-block text-sm font-medium !text-black underline"
                              href={getDetailsLink(session) ?? undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Time Schedule
                            </a>
                          ) : null}
                          <GetBuddyButton sport={sport} sessionKey={session.session_key} userName={meta.display_name} userDegree={meta.degree} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </SportCard>
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
