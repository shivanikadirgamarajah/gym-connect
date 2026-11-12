import { ReactNode } from 'react'

type SportCardProps = {
  sport: string
  index: number
  children: ReactNode
}

export function hasSportBackground(sport: string) {
  return /badminton|basketball|bingo|game\s*-?\s*night|trivia\s*-?\s*night|futsal|volleyball|pickleball|turf\s*-?\s*soccer|turfsoccer|soccer|squash|table[ _-]?tennis|tennis|board[ _-]?games/i.test(sport)
}

function getSportCardBackground(sport: string) {
  if (/tennis/i.test(sport) && !/table[ _-]?tennis/i.test(sport)) {
    return "linear-gradient(rgba(18, 32, 10, 0.32), rgba(18, 32, 10, 0.32)), url('/tennis.jpg')"
  }
  if (/table[ _-]?tennis/i.test(sport)) {
    return "linear-gradient(rgba(26, 12, 8, 0.22), rgba(26, 12, 8, 0.22)), url('/tabletennis.jpg')"
  }
  if (/squash/i.test(sport)) {
    return "linear-gradient(rgba(20, 10, 24, 0.54), rgba(20, 10, 24, 0.54)), url('/squash.jpg')"
  }
  if (/badminton/i.test(sport)) {
    return "linear-gradient(rgba(10, 24, 20, 0.58), rgba(10, 24, 20, 0.58)), url('/badminton-bg.jpeg')"
  }
  if (/basketball/i.test(sport)) {
    return "linear-gradient(rgba(26, 12, 8, 0.55), rgba(26, 12, 8, 0.55)), url('/basketball-bg.jpg')"
  }
  if (/bingo/i.test(sport)) {
    return "linear-gradient(rgba(35, 18, 10, 0.52), rgba(35, 18, 10, 0.52)), url('/bingo-bg.jpg')"
  }
  if (/board[ _-]?games/i.test(sport)) {
    return "linear-gradient(rgba(17, 14, 28, 0.56), rgba(17, 14, 28, 0.56)), url('/gamenight-bg.jpg')"
  }
  if (/trivia\s*-?\s*night/i.test(sport)) {
    return "linear-gradient(rgba(17, 14, 28, 0.56), rgba(17, 14, 28, 0.56)), url('/trivia.jpg')"
  }
  if (/futsal/i.test(sport)) {
    return "linear-gradient(rgba(9, 22, 17, 0.52), rgba(9, 22, 17, 0.52)), url('/futsal.jpg')"
  }
  if (/volleyball/i.test(sport)) {
    return "linear-gradient(rgba(11, 19, 30, 0.5), rgba(11, 19, 30, 0.5)), url('/volleyball.jpg')"
  }
  if (/pickleball/i.test(sport)) {
    return "linear-gradient(rgba(16, 23, 10, 0.5), rgba(16, 23, 10, 0.5)), url('/pickleball.jpg')"
  }
  if (/turf\s*-?\s*soccer|turfsoccer|soccer/i.test(sport)) {
    return "linear-gradient(rgba(8, 24, 10, 0.54), rgba(8, 24, 10, 0.54)), url('/turfsoccer.jpg')"
  }
  return undefined
}

export default function SportCard({ sport, index, children }: SportCardProps) {
  const hasBackground = hasSportBackground(sport)

  return (
    <article
      className={`surface-card card-lift fade-rise min-h-70 rounded-2xl p-6 ${hasBackground ? 'border-white/40 text-white' : ''} ${index % 2 === 0 ? 'stagger-1' : 'stagger-2'}`}
      style={
        hasBackground
          ? {
              backgroundImage: getSportCardBackground(sport),
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {children}
    </article>
  )
}
