import Link from 'next/link'

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
      <section className="surface-card fade-rise grid w-full gap-8 rounded-3xl p-8 md:grid-cols-[1.2fr_0.8fr] md:p-12">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border border-[var(--line)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
            York University Drop-In Tracker
          </p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-5xl">
            Gym Connect makes every open court easy to find.
          </h1>
          <p className="max-w-lg text-base ink-soft md:text-lg">
            Pull active York recreation sessions into one clean feed, grouped by sport and ready to scan in seconds.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="cta rounded-xl px-5 py-3 text-sm font-medium text-center">
              Sign In With York Email
            </Link>
            <Link
              href="/feed"
              className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-center"
            >
              View Live Feed
            </Link>
          </div>
        </div>
        <div className="fade-rise stagger-1 surface-card rounded-2xl bg-[var(--surface)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] ink-soft">Live Features</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="rounded-lg bg-white p-3">Auto-sync from York program instances</li>
            <li className="rounded-lg bg-white p-3">Alphabetical sport cards</li>
            <li className="rounded-lg bg-white p-3">Secure login with York email OTP</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
