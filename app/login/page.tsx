'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/supabase/client'
import { Button } from '../components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { Input } from '@/app/components/ui/Input'

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
        // For ALLOWED_EMAILS, do NOT set emailRedirectTo, so only code is sent
        // For York emails, also do NOT set emailRedirectTo, so only code is sent
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Code sent. Check your email. Do not forget to check spam!')
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
      router.push('/complete-profile')
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

        <Card className="fade-rise mx-auto mt-10 w-full max-w-md rounded-3xl p-7 md:mt-12 md:p-8">
          <h1 className="text-3xl font-semibold mb-2">Login/Sign Up</h1>
          <p className="text-sm ink-soft mb-6">
            Use your university email to get a one-time code.
          </p>

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                id="university-email"
                label="University email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@yorku.ca"
                required
              />

              <Button
                type="submit"
                disabled={loading}
                className="btn-press login-cta w-full"
              >
                {loading ? "Sending..." : "Send code"}
              </Button>

            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <Input
                id="login-email"
                label="Email"
                type="email"
                value={email}
                disabled
              />

              <Input
                id="login-code"
                label="8-digit code"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456"
                required
              />

              <Button
                type="submit"
                disabled={loading}
                className="btn-press login-cta w-full"
              >
                {loading ? 'Verifying...' : 'Verify code'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep('email')}
                className="btn-press w-full"
              >
                Use a different email
              </Button>
            </form>
          )}

          {message && <p className="mt-4 text-sm ink-soft">{message}</p>}
        </Card>
      </div>
    </main>
  )
}
