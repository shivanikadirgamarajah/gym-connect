'use client'

import { FormEvent, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { createClient } from '@/app/supabase/client'

type Buddy = { display_name: string; degree: string; preferred_time_start: string; preferred_time_end: string }

type MatchResult =
  | { matched: true; buddies: Buddy[] }
  | { matched: false }

type GetBuddyButtonProps = {
  sport: string
  sessionKey: string
  userName?: string
  userDegree?: string
}

export default function GetBuddyButton({ sport, sessionKey, userName, userDegree }: GetBuddyButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [error, setError] = useState('')
  const [requestUserName, setRequestUserName] = useState(userName)
  const [requestUserDegree, setRequestUserDegree] = useState(userDegree)

  const time = `${timeStart} - ${timeEnd}`;

  function closeModal() {
    setOpen(false)
    setResult(null)
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/buddy/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport_name: sport,
          display_name: requestUserName,
          degree: requestUserDegree,
          preferred_date: date,
          preferred_time_start: timeStart,
          preferred_time_end: timeEnd,
          session_key: sessionKey,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong.')
      } else {
        setResult(json)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleClick() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setRequestUserName(userName ?? user.user_metadata?.display_name)
    setRequestUserDegree(userDegree ?? user.user_metadata?.degree)
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="group relative inline-flex items-center justify-center rounded-2xl border border-white/30 bg-red-900/75 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-800/80 hover:shadow-xl hover:shadow-red-950/30 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-red-300/60"
      >
        <img src ="/buddy-wave.gif" alt="" className="buddy-gif" />
        <span className="relative">Get a buddy</span>
      </button>

      {mounted && open
        ? createPortal(
          <div
            className="modal-backdrop fixed inset-0 z-[999] grid place-items-center bg-zinc-950/65 p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeModal()
              }
            }}
          >
            <div
              className="modal-card max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/70 bg-[var(--surface)] p-6 shadow-2xl sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>


                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-zinc-900">Find a buddy</h3>
                    <p className="mt-0.5 text-sm text-zinc-500">{sport}</p>
                  </div>

                  {!result ? (
                    <p className="mt-5 rounded-xl bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-600">
                      Tell us when you&apos;re free and we&apos;ll look for someone with a matching schedule.
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--line)] text-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                  aria-label="Close popup"
                >
                  ×
                </button>
              </div>

              {result ? (
                result.matched ? (
                  <div className="mt-8 space-y-6">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                      <p className="flex items-center gap-2 text-base font-semibold text-emerald-800">
                        <span className="grid size-7 place-items-center rounded-full bg-emerald-200" aria-hidden="true">✓</span>
                        {result.buddies.length === 1 ? 'Buddy found!' : `${result.buddies.length} buddies found!`}
                      </p>
                      <ul className="mt-4 space-y-2">
                        {result.buddies.map((b, i) => (
                          <li key={i} className="rounded-xl bg-white/70 p-3 text-sm text-emerald-800">
                            <strong>{b.display_name}</strong> ({b.degree}),
                            available {b.preferred_time_start} – {b.preferred_time_end}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 text-sm text-emerald-700">
                        Head to the <strong>Messages</strong> tab to start chatting!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="btn-press w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white hover:bg-red-800"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="mt-8 space-y-6">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <p className="flex items-center gap-2 text-base font-semibold text-amber-800">
                        <span className="grid size-7 place-items-center rounded-full bg-amber-200" aria-hidden="true">✓</span>
                        Request saved!
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-amber-700">
                        No one is available right now for {date} around {time}. We&apos;ll notify you when someone with an overlapping time signs up.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="btn-press w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white hover:bg-red-800"
                    >
                      Done
                    </button>
                  </div>
                )
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-zinc-800">Preferred date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--accent)]"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="mb-2 block text-sm font-semibold text-zinc-800">Start time</label>
                      <input
                        type="time"
                        value={timeStart}
                        onChange={(e) => setTimeStart(e.target.value)}
                        className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--accent)]"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-2 block text-sm font-semibold text-zinc-800">End time</label>
                      <input
                        type="time"
                        value={timeEnd}
                        onChange={(e) => setTimeEnd(e.target.value)}
                        className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 outline-none focus:border-[var(--accent)]"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-press mt-2 w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Finding a match…' : 'Submit request'}
                  </button>
                </form>
              )}
            </div>
          </div>,
          document.body
        )
        : null}
    </>
  )
}
