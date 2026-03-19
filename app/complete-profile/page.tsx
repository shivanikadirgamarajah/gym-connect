
'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../supabase/client'

export default function CompleteProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState('')
  const [degree, setDegree] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      const meta = user.user_metadata
      if (meta?.display_name && meta?.degree) {
        router.replace('/feed')
        return
      }
      if (meta?.display_name) setName(meta.display_name)
      if (meta?.degree) setDegree(meta.degree)
      setChecking(false)
    }
    check()
  }, [supabase, router])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const trimmedName = name.trim()
    const trimmedDegree = degree.trim()

    if (!trimmedName || !trimmedDegree) {
      setMessage('Please fill in both fields.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      data: { display_name: trimmedName, degree: trimmedDegree },
    })

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/feed')
      router.refresh()
    }

    setLoading(false)
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-red-900 flex items-center justify-center p-6">
        <p className="text-white text-lg animate-pulse">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-red-900 flex items-start justify-center p-6 pt-10 md:pt-16">
      <div className="w-full max-w-6xl">
        <h1 className="whitespace-nowrap text-center text-[clamp(3rem,12vw,8rem)] font-bold tracking-[0.12em] text-white">
          BUDDY FINDER
        </h1>

        <div className="surface-card fade-rise mx-auto mt-10 w-full max-w-md rounded-3xl p-7 md:mt-12 md:p-8">
          <h2 className="text-3xl font-semibold mb-2">Complete Your Profile</h2>
          <p className="text-sm ink-soft mb-6">
            Tell us a bit about yourself so buddies can find you.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 font-medium">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 outline-none focus:border-[var(--accent)]"
                required
                maxLength={60}
              />
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium">Degree / Program</label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 outline-none focus:border-[var(--accent)]"
                required
                maxLength={100}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cta btn-press w-full rounded-xl px-4 py-2.5 font-medium"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>

          {message && <p className="mt-4 text-sm ink-soft">{message}</p>}
        </div>
      </div>
    </main>
  )
}
