'use client'

import { FormEvent, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

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
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [error, setError] = useState('')

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
          display_name: userName,
          degree: userDegree,
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-press text-sm font-semibold text-red-600 underline underline-offset-2 transition-colors hover:text-red-800"
      >
        get a buddy
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="modal-backdrop fixed inset-0 z-[999] grid place-items-center bg-black/60 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  closeModal()
                }
              }}
            >
              <div
                className={`modal-card w-full max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-10 shadow-2xl max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-900">Find a buddy</h3>
                    <p className="mt-1 text-sm text-zinc-600">{sport}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-[var(--line)] px-2 py-1 text-sm text-zinc-700"
                    aria-label="Close popup"
                  >
                    Close
                  </button>
                </div>

                {result ? (
                  result.matched ? (
                    <div className="mt-8 space-y-6">
                      <div className="rounded-xl bg-green-50 border border-green-200 p-6">
                        <p className="text-base font-semibold text-green-800">
                          {result.buddies.length === 1 ? 'Buddy found!' : `${result.buddies.length} buddies found!`}
                        </p>
                        <ul className="mt-3 space-y-3">
                          {result.buddies.map((b, i) => (
                            <li key={i} className="text-sm text-green-700">
                              <strong>{b.display_name}</strong> ({b.degree}),
                              available {b.preferred_time_start} – {b.preferred_time_end}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-sm text-green-600">
                          Head to the <strong>Messages</strong> tab to start chatting!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="btn-press w-full rounded-xl bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <div className="mt-8 space-y-6">
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-6">
                        <p className="text-base font-semibold text-amber-800">Request saved!</p>
                        <p className="mt-2 text-sm text-amber-700">
                          No one is available right now for {date} around {time}. We'll notify you when someone with an overlapping time signs up.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="btn-press w-full rounded-xl bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800"
                      >
                        Done
                      </button>
                    </div>
                  )
                ) : (
                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-800">Preferred date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]"
                        required
                      />
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="mb-1 block text-sm font-medium text-zinc-800">Preferred time (start)</label>
                        <input
                          type="time"
                          value={timeStart}
                          onChange={(e) => setTimeStart(e.target.value)}
                          className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mb-1 block text-sm font-medium text-zinc-800">Preferred time (end)</label>
                        <input
                          type="time"
                          value={timeEnd}
                          onChange={(e) => setTimeEnd(e.target.value)}
                          className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]"
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-press mt-6 w-full rounded-xl bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
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
