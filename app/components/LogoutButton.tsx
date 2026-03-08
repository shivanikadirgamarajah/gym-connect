'use client'

import { createClient } from '@/app/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const supabase = createClient()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-black transition hover:bg-[var(--accent-soft)]"
    >
      Log out
    </button>
  )
}