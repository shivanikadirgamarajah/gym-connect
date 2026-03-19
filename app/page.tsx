import Link from 'next/link'

const SPORTS = ['Badminton', 'Basketball', 'Volleyball', 'Futsal', 'Pickleball', 'Bingo']

const FEATURES = [
  {
    icon: '⚡',
    title: 'Live session sync',
    desc: 'Auto-pulled from York recreation in real time.',
  },
  {
    icon: '🎯',
    title: 'Find a buddy',
    desc: 'Get matched with someone free at the same time.',
  },
  {
    icon: '🔒',
    title: 'York-only access',
    desc: 'Secure OTP login — your @yorku.ca email only.',
  },
]

export default function Home() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-[#0a0a0f] text-white">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-red-900/30 blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-red-800/20 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-950/20 blur-[80px]" />
      </div>

      <div className="relative flex h-full flex-col overflow-y-auto">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 md:px-12">
          <span className="text-lg font-bold tracking-tight text-white">Buddy Finder</span>
          <Link
            href="/login"
            className="btn-press rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
          >
            Sign in
          </Link>
        </nav>

        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-4 text-center md:pt-8">
          <div className="fade-rise mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-red-300">
            <span className="size-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
            York University · Drop-In Sports
          </div>

          <h1 className="fade-rise stagger-1 max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight md:text-7xl">
            Find your next
            <span className="block bg-gradient-to-r from-red-400 via-orange-300 to-red-400 bg-clip-text text-transparent">
              sports buddy.
            </span>
          </h1>

          <p className="fade-rise stagger-2 mt-5 max-w-lg text-base leading-relaxed text-white/60 md:text-lg">
            Browse live York rec sessions, pick a sport, and get matched with someone free at the same time.
          </p>

          <div className="fade-rise stagger-2 mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="btn-press rounded-full bg-red-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-500 hover:shadow-red-800/60 hover:-translate-y-0.5"
            >
              Get started free →
            </Link>
            <Link
              href="/feed"
              className="btn-press rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-semibold text-white/80 backdrop-blur transition hover:bg-white/10 hover:-translate-y-0.5"
            >
              View live feed
            </Link>
          </div>

          {/* Scrolling sport pills */}
          <div className="fade-rise stagger-2 mt-12 flex flex-wrap justify-center gap-2">
            {SPORTS.map((s) => (
              <span
                key={s}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/50"
              >
                {s}
              </span>
            ))}
          </div>

          {/* Feature cards */}
          <div className="fade-rise stagger-2 mt-14 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur transition hover:bg-white/10 hover:border-white/20"
              >
                <span className="text-2xl">{f.icon}</span>
                <p className="mt-3 text-sm font-semibold text-white">{f.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
