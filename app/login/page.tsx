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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Login</h1>
        <p className="text-sm text-gray-600 mb-6">
          Use your university email to get a one-time code.
        </p>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">University email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@yorku.ca"
                className="w-full rounded-lg border px-3 py-2"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg border px-4 py-2 font-medium"
            >
              {loading ? 'Sending...' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-lg border px-3 py-2 bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">8-digit code</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456"
                className="w-full rounded-lg border px-3 py-2"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg border px-4 py-2 font-medium"
            >
              {loading ? 'Verifying...' : 'Verify code'}
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full rounded-lg px-4 py-2 text-sm underline"
            >
              Use a different email
            </button>
          </form>
        )}

        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>
    </main>
  )
}
