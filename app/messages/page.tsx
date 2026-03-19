'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Conversation = {
  id: string
  match_id: string
  other_user_id: string
  name: string
  degree: string
  sport: string
  lastMessage: string
  time: string
  unread: number
  avatar: string
}

type Message = {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSentAt = useRef(0)
  const justSent = useRef(false)

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch('/api/buddy/matches')
        const json = await res.json()
        if (res.ok && json.conversations) {
          setConversations(json.conversations)
        } else {
          setConversations([])
        }
      } catch {
        setConversations([])
      } finally {
        setLoading(false)
      }
    }
    fetchMatches()
  }, [])

  async function loadMessages(matchId: string, isInitial = false) {
    // Skip poll refresh if we just sent a message (avoid flicker from key change)
    if (!isInitial && Date.now() - lastSentAt.current < 4000) return
    if (isInitial) setMsgLoading(true)
    try {
      const res = await fetch(`/api/messages?match_id=${encodeURIComponent(matchId)}`)
      const json = await res.json()
      if (res.ok) {
        const serverMsgs: Message[] = json.messages ?? []
        // Replace state cleanly — drop any optimistic messages that the server now has
        setMessages((prev) => {
          const optimistic = prev.filter((m) => m.id.startsWith('temp-'))
          const confirmed = serverMsgs.filter((sm) =>
            optimistic.some(
              (om) => om.content === sm.content && om.sender_id === sm.sender_id
            )
          )
          const confirmedIds = new Set(confirmed.map((c) => c.id))
          // Keep optimistic only if no matching server message exists yet
          const remaining = optimistic.filter(
            (om) =>
              !serverMsgs.some(
                (sm) => sm.content === om.content && sm.sender_id === om.sender_id
              )
          )
          return [...serverMsgs, ...remaining]
        })
        setCurrentUserId(json.current_user_id ?? null)
      }
    } catch {
      /* ignore */
    } finally {
      if (isInitial) setMsgLoading(false)
    }
  }

  function openConversation(conv: Conversation) {
    setActiveConv(conv)
    setMessages([])
    loadMessages(conv.match_id, true)

    // Mark messages as read
    fetch('/api/messages/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ match_id: conv.match_id }),
    }).then(() => {
      // Clear the unread badge for this conversation
      setConversations((prev) =>
        prev.map((c) => (c.match_id === conv.match_id ? { ...c, unread: 0 } : c))
      )
    })

    // Poll for new messages every 3 seconds
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => {
      loadMessages(conv.match_id)
      // Keep marking as read while chat is open
      fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: conv.match_id }),
      })
    }, 3000)
  }

  function closeConversation() {
    setActiveConv(null)
    setMessages([])
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  useEffect(() => {
    const el = scrollAreaRef.current
    if (!el) return
    // Auto-scroll only if user is near the bottom or just sent a message
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (justSent.current || distFromBottom < 120) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      justSent.current = false
    }
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!activeConv || !newMsg.trim() || sending) return
    const text = newMsg.trim()
    setNewMsg('')
    setSending(true)

    // Optimistic: show message instantly
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      match_id: activeConv.match_id,
      sender_id: currentUserId ?? '',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    lastSentAt.current = Date.now()
    justSent.current = true

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: activeConv.match_id, content: text }),
      })
    } catch {
      /* ignore */
    } finally {
      setSending(false)
    }
  }

  // --- Chat view ---
  if (activeConv) {
    return (
      <main className="flex min-h-screen flex-col text-zinc-900">
        {/* Chat header */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-red-950 bg-red-900/95 p-4 text-red-50 backdrop-blur">
          <button
            onClick={closeConversation}
            className="btn-press flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-red-200 transition hover:bg-red-800"
          >
            ← Back
          </button>
          <div className="flex size-9 items-center justify-center rounded-full bg-red-700 text-sm font-semibold text-white">
            {activeConv.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">{activeConv.name}</p>
            <p className="truncate text-xs text-red-200">
              {activeConv.sport} · {activeConv.time}
            </p>
          </div>
        </div>

        {/* Messages area */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-2xl space-y-3">
            {msgLoading && messages.length === 0 ? (
              <div className="space-y-4 py-6">
                {[
                  { side: 'start', w: 'w-3/5', h: 'h-12', delay: '0ms' },
                  { side: 'end', w: 'w-2/5', h: 'h-10', delay: '100ms' },
                  { side: 'start', w: 'w-1/2', h: 'h-10', delay: '200ms' },
                  { side: 'end', w: 'w-3/5', h: 'h-14', delay: '300ms' },
                  { side: 'start', w: 'w-2/5', h: 'h-10', delay: '400ms' },
                ].map((b, i) => (
                  <div key={i} className={`flex ${b.side === 'end' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`${b.h} ${b.w} rounded-2xl ${
                        b.side === 'end' ? 'rounded-br-md bg-zinc-100' : 'rounded-bl-md bg-zinc-100'
                      } skeleton-fast`}
                      style={{
                        animation: `pulse 1.2s ease-in-out ${b.delay} infinite`,
                      }}
                    />
                  </div>
                ))}
                <div className="flex justify-center pt-2">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="inline-block size-1.5 rounded-full bg-zinc-300"
                        style={{
                          animation: `bounce 1s ease-in-out ${d * 150}ms infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-red-50 text-2xl">
                  👋
                </div>
                <p className="text-sm text-zinc-500">No messages yet. Say hi to {activeConv.name}!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId
                const isOptimistic = msg.id.startsWith('temp-')
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    style={{
                      animation: isOptimistic ? 'msgSlideIn 0.3s ease-out both' : undefined,
                    }}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isMe
                          ? 'rounded-br-md bg-red-900 text-white'
                          : 'rounded-bl-md bg-white text-zinc-900 ring-1 ring-zinc-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          isMe ? 'text-red-300' : 'text-zinc-400'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Message input */}
        <div className="sticky bottom-0 border-t border-zinc-200 bg-white/80 p-3 backdrop-blur">
          <form onSubmit={sendMessage} className="mx-auto flex max-w-2xl gap-2">
            <input
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newMsg.trim() || sending}
              className="btn-press rounded-xl bg-red-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-800 disabled:opacity-40"
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  // --- Conversation list ---
  return (
    <main className="min-h-screen w-full text-zinc-900">
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-red-950 bg-red-900/95 p-4 text-red-50 backdrop-blur md:p-5">
        <div className="flex items-center gap-3">
          <Link
            href="/feed"
            className="btn-press flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-red-200 transition hover:bg-red-800"
            aria-label="Back to feed"
          >
            Back
          </Link>
          <h1 className="text-2xl font-semibold md:text-3xl">Messages</h1>
        </div>
        <span className="text-sm text-red-200">Your buddy conversations</span>
      </div>

      <div className="mx-auto max-w-2xl p-4 md:p-6">
        <ul className="space-y-2">
          {loading ? (
            <>  
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-center gap-4 rounded-2xl bg-white p-4 skeleton-fast">
                  <div className="size-12 rounded-full bg-zinc-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-zinc-200" />
                    <div className="h-3 w-2/3 rounded bg-zinc-100" />
                  </div>
                </li>
              ))}
            </>
          ) : conversations.length > 0 ? (
            conversations.map((conv) => (
              <li key={conv.match_id}>
                <button
                  type="button"
                  onClick={() => openConversation(conv)}
                  className="surface-card card-lift fade-rise flex w-full items-center gap-4 rounded-2xl p-4 text-left transition hover:shadow-md"
                >
                  <div className="relative flex size-12 items-center justify-center rounded-full bg-red-900 text-sm font-semibold text-white">
                    {conv.avatar}
                    {conv.unread > 0 && (
                      <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-2 ring-white">
                        {conv.unread > 9 ? '9+' : conv.unread}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold text-zinc-900">{conv.name}</span>
                      <span className="flex-shrink-0 text-xs text-zinc-400">{conv.time}</span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                        {conv.sport}
                      </span>
                      <span className="truncate text-xs text-zinc-500">{conv.degree}</span>
                    </div>

                    <p className="mt-1 truncate text-sm text-zinc-800">{conv.lastMessage}</p>
                  </div>
                </button>
              </li>
            ))
          ) : (
            <li className="text-center text-sm text-zinc-500">No matches found yet.</li>
          )}
        </ul>
      </div>
    </main>
  )
}