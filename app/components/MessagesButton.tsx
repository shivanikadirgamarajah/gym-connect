'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function MessagesButton() {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch('/api/messages/unread')
        const json = await res.json()
        if (res.ok) setUnread(json.unread ?? 0)
      } catch {
        /* ignore */
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Link
      href="/messages"
      className="btn-press relative rounded-xl border border-black bg-blue-900 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-blue-950 hover:shadow-lg"
    >
      Messages
      {unread > 0 && (
        <span className="badge-pop absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
