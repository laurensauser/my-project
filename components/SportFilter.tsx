import Link from 'next/link'
import type { Sport } from '@/lib/types'

interface SportFilterProps {
  sports: Sport[]
  activeSport: string | null
}

export default function SportFilter({ sports, activeSport }: SportFilterProps) {
  const tabClass = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
      active
        ? 'bg-purple-600 text-white'
        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
    }`

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      <Link href="/board/featured" className={tabClass(activeSport === 'featured')}>
        Featured
      </Link>

      <Link href="/board" className={tabClass(!activeSport)}>
        All
      </Link>

      {sports.map((sport) => (
        <Link
          key={sport.slug}
          href={`/board/${sport.slug}`}
          className={tabClass(activeSport === sport.slug)}
        >
          {sport.name}
        </Link>
      ))}
    </div>
  )
}
