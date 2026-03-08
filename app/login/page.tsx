'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const cleanEmail = email.trim().toLowerCase()

    const [, domain = ''] = cleanEmail.split('@')
    const isYorkDomain = domain === 'yorku.ca' || domain.endsWith('.yorku.ca')

    if (!isYorkDomain) {
      setMessage('Use your York University email address.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Code sent. Check your email.')
      setStep('otp')
    }

    setLoading(false)
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Logged in successfully.')
      router.push('/feed')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-red-900 flex items-start justify-center p-6 pt-10 md:pt-16">
      <div className="w-full max-w-6xl">
        <h1 className="whitespace-nowrap text-center text-[clamp(3rem,12vw,8rem)] font-bold tracking-[0.12em] text-white">
          BUDDY FINDER
        </h1>

        <div className="surface-card fade-rise mx-auto mt-10 w-full max-w-md rounded-3xl p-7 md:mt-12 md:p-8">
        <h1 className="text-3xl font-semibold mb-2">Login/Sign Up</h1>
        <p className="text-sm ink-soft mb-6">
          Use your university email to get a one-time code.
        </p>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 font-medium">University email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@yorku.ca"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 outline-none focus:border-[var(--accent)]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cta w-full rounded-xl px-4 py-2.5 font-medium"
            >
              {loading ? 'Sending...' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 font-medium">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-xl border border-[var(--line)] bg-zinc-100 px-3 py-2.5"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium">8-digit code</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 outline-none focus:border-[var(--accent)]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cta w-full rounded-xl px-4 py-2.5 font-medium"
            >
              {loading ? 'Verifying...' : 'Verify code'}
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm"
            >
              Use a different email
            </button>
          </form>
        )}

        {message && <p className="mt-4 text-sm ink-soft">{message}</p>}
        </div>
      </div>
    </main>
  )
}
