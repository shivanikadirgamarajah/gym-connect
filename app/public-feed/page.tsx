import Link from 'next/link'
import FeedHeader from '@/app/components/FeedHeader'
import SportCard, { hasSportBackground } from '@/app/components/SportCard'
import { createClient } from '@/app/supabase/server'
import GetBuddyButton from '../feed/GetBuddyButton'

type Session = {
  session_key: string
  sport_name: string | null
  source_url: string | null
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

export default async function PublicFeedPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dropin_sessions')
    .select('session_key, sport_name, source_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const sessions: Session[] = data ?? []
  const sessionsBySport = sessions.reduce<Record<string, Session[]>>((acc, session) => {
    const sport = session.sport_name?.trim() || 'Other Sports'
    if (!acc[sport]) acc[sport] = []
    acc[sport].push(session)
    return acc
  }, {})

  const sportNameSorter = new Intl.Collator('en-CA', { sensitivity: 'base' })
  const sportEntries = Object.entries(sessionsBySport).sort(([a], [b]) =>
    sportNameSorter.compare(a, b)
  )

  return (
    <main className="min-h-screen w-full p-6 text-zinc-900 md:p-8">
      <FeedHeader description="Browse active York recreation sessions.">
        <Link
          href="/login"
          className="btn-press rounded-full border border-white/40 bg-black/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-black/35"
        >
          Sign in/ Sign up
        </Link>
      </FeedHeader>

      {error ? (
        <p className="mt-6 text-sm text-red-600">Failed to load sessions: {error.message}</p>
      ) : sportEntries.length === 0 ? (
        <p className="mt-6 text-sm ink-soft">No active sessions yet.</p>
      ) : (
        <section className="mt-6">
          <p className="text-sm ink-soft">Sign in to find a buddy and connect with other students.</p>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sportEntries.map(([sport, sportSessions], idx) => (
              <SportCard key={sport} sport={sport} index={idx}>
                <h2 className="text-xl font-semibold">{sport}</h2>
                <ul className="mt-5 space-y-3">
                  {sportSessions.map((session) => {
                    const detailsLink = getDetailsLink(session)
                    return (
                      <li
                        key={session.session_key}
                        className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${hasSportBackground(sport) ? 'border-white/40 bg-white' : 'border-[var(--line)] bg-[var(--surface)]'}`}
                      >
                        <div className="mt-1 flex w-full items-center justify-between gap-6">
                          {detailsLink ? (
                            <a
                              className="inline-block text-sm font-medium !text-black underline"
                              href={detailsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Time schedule
                            </a>
                          ) : (
                            <span className="text-sm !text-black">Time schedule unavailable</span>
                          )}
                          <GetBuddyButton sport={sport} sessionKey={session.session_key} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </SportCard>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
