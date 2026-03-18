'use client'

import { FormEvent, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

type MatchResult =
  | { matched: true; buddy: { display_name: string; degree: string; preferred_time: string } }
  | { matched: false }

type GetBuddyButtonProps = {
  sport: string
  sessionKey: string
}

export default function GetBuddyButton({ sport, sessionKey }: GetBuddyButtonProps) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [degree, setDegree] = useState('')
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
          display_name: name,
          degree,
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
        className="text-sm font-semibold text-red-600 underline underline-offset-2"
      >
        get a buddy
      </button>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[999] grid place-items-center bg-black/60 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  closeModal()
                }
              }}
            >
              <div
                className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
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
                    <div className="mt-5 space-y-3">
                      <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                        <p className="text-sm font-semibold text-green-800">Buddy found!</p>
                        <p className="mt-1 text-sm text-green-700">
                          Your buddy is <strong>{result.buddy.display_name}</strong> ({result.buddy.degree}),
                          available from {result.buddy.preferred_time_start} to {result.buddy.preferred_time_end}.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="w-full rounded-xl bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                        <p className="text-sm font-semibold text-amber-800">Request saved!</p>
                        <p className="mt-1 text-sm text-amber-700">
                          No one is available right now for {date} around {time}. We'll notify you when someone with an overlapping time signs up.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="w-full rounded-xl bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800"
                      >
                        Done
                      </button>
                    </div>
                  )
                ) : (
                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-800">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-zinc-800">Degree</label>
                      <input
                        type="text"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]"
                        required
                      />
                    </div>

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
                      className="w-full rounded-xl bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
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
