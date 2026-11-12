import { ReactNode } from 'react'

type FeedHeaderProps = {
  description: string
  sticky?: boolean
  children: ReactNode
}

export default function FeedHeader({
  description,
  sticky = false,
  children,
}: FeedHeaderProps) {
  return (
    <header
      className={`fade-rise ${sticky ? 'sticky top-0 z-30' : ''} -mx-6 -mt-6 flex flex-wrap items-center justify-between gap-3 border border-[var(--accent-hover)] bg-[var(--accent)] p-4 text-white backdrop-blur md:-mx-8 md:-mt-8 md:p-5`}
    >
      <div className="flex flex-wrap items-baseline gap-2">
        <h1 className="text-2xl font-semibold md:text-3xl">Buddy Finder</h1>
        <p className="text-sm text-white/80">{description}</p>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  )
}
