import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/app/supabase/server'
import LogoutButton from '@/app/components/LogoutButton'
import MessagesButton from '@/app/components/MessagesButton'
import GetBuddyButton from './GetBuddyButton'

type Session = {
  session_key: string
  sport_name: string | null
  source_url: string | null
}

function hasSportBackground(sport: string) {
  return /badminton|basketball|bingo|game\s*-?\s*night|trivia\s*-?\s*night|futsal|volleyball|pickleball|turf\s*-?\s*soccer|turfsoccer|soccer|squash|table[ _-]?tennis|tennis|board[ _-]?games/i.test(sport)
}

function getSportCardBackground(sport: string) {
        if (/tennis/i.test(sport) && !/table[ _-]?tennis/i.test(sport)) {
          return "linear-gradient(rgba(18, 32, 10, 0.32), rgba(18, 32, 10, 0.32)), url('/tennis.jpg')"
        }
      if (/table[ _-]?tennis/i.test(sport)) {
        return "linear-gradient(rgba(26, 12, 8, 0.22), rgba(26, 12, 8, 0.22)), url('/tabletennis.jpg')"
      }
    if (/squash/i.test(sport)) {
      return "linear-gradient(rgba(20, 10, 24, 0.54), rgba(20, 10, 24, 0.54)), url('/squash.jpg')"
    }
  if (/badminton/i.test(sport)) {
    return "linear-gradient(rgba(10, 24, 20, 0.58), rgba(10, 24, 20, 0.58)), url('/badminton-bg.jpeg')"
  }

  if (/basketball/i.test(sport)) {
    return "linear-gradient(rgba(26, 12, 8, 0.55), rgba(26, 12, 8, 0.55)), url('/basketball-bg.jpg')"
  }

  if (/bingo/i.test(sport)) {
    return "linear-gradient(rgba(35, 18, 10, 0.52), rgba(35, 18, 10, 0.52)), url('/bingo-bg.jpg')"
  }

  if (/board[ _-]?games/i.test(sport)) {
    return "linear-gradient(rgba(17, 14, 28, 0.56), rgba(17, 14, 28, 0.56)), url('/gamenight-bg.jpg')"
  }

  if (/trivia\s*-?\s*night/i.test(sport)) {
    return "linear-gradient(rgba(17, 14, 28, 0.56), rgba(17, 14, 28, 0.56)), url('/trivia.jpg')"
  }

  if (/futsal/i.test(sport)) {
    return "linear-gradient(rgba(9, 22, 17, 0.52), rgba(9, 22, 17, 0.52)), url('/futsal.jpg')"
  }

  if (/volleyball/i.test(sport)) {
    return "linear-gradient(rgba(11, 19, 30, 0.5), rgba(11, 19, 30, 0.5)), url('/volleyball.jpg')"
  }

  if (/pickleball/i.test(sport)) {
    return "linear-gradient(rgba(16, 23, 10, 0.5), rgba(16, 23, 10, 0.5)), url('/pickleball.jpg')"
  }

  if (/turf\s*-?\s*soccer|turfsoccer|soccer/i.test(sport)) {
    return "linear-gradient(rgba(8, 24, 10, 0.54), rgba(8, 24, 10, 0.54)), url('/turfsoccer.jpg')"
  }

  return undefined
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

  if (!user) {
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
    <main className="min-h-screen w-full p-6 text-zinc-900 md:p-8">
      <div className="fade-rise sticky top-0 z-30 -mx-6 -mt-6 flex flex-wrap justify-between items-center gap-3 border border-red-950 bg-red-900/95 p-4 text-red-50 backdrop-blur md:-mx-8 md:-mt-8 md:p-5">
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-2xl font-semibold md:text-3xl">Buddy Finder</h1>
          <p className="text-sm text-red-200">find your partner to play a sport!</p>
        </div>
        <div className="flex items-center gap-2">
          <MessagesButton />
          <LogoutButton />
        </div>
      </div>

      <p className="mt-4 text-sm ink-soft">Signed in as {user.email}</p>

      {error ? (
        <p className="mt-4 text-sm text-red-600">Failed to load sessions: {error.message}</p>
      ) : (
        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">Choose a sport to play with a buddy...</h2>
          {sportEntries.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sportEntries.map(([sport, sportSessions], idx) => (
                <article
                  key={sport}
                  className={`surface-card card-lift fade-rise min-h-70 rounded-2xl p-6 ${hasSportBackground(sport) ? 'border-white/40 text-white' : ''} ${idx % 2 === 0 ? 'stagger-1' : 'stagger-2'}`}
                  style={
                    hasSportBackground(sport)
                      ? {
                          backgroundImage: getSportCardBackground(sport),
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : undefined
                  }
                >
                  <div className="flex items-start gap-2">
                    <h3 className="text-xl font-semibold">{sport}</h3>
                  </div>

                  <ul className="mt-5 space-y-3">
                    {sportSessions.map((session) => (
                      <li
                        key={session.session_key}
                        className={`rounded-xl border p-4 ${hasSportBackground(sport) ? 'border-white/40 bg-white' : 'border-[var(--line)] bg-[var(--surface)]'}`}
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
