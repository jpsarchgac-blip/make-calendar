import { useEffect, useState } from 'react'
import { FOOTPRINT_TINT_COLORS, tintedFootprintDataUrl, footprintUrl } from '../footprintTint'

const COLORS = [...FOOTPRINT_TINT_COLORS]

type Spot = {
  top: string
  left?: string
  right?: string
  size: number
  rotate: number
  opacity: number
  color: string
}

/** 表面：左上（月名・タイトル）と重ならない配置 */
const FRONT_SPOTS: Spot[] = [
  { top: '6%', right: '1%', size: 118, rotate: -18, opacity: 0.82, color: COLORS[0] },
  { top: '14%', right: '12%', size: 104, rotate: 22, opacity: 0.78, color: COLORS[1] },
  { top: '24%', right: '3%', size: 96, rotate: -8, opacity: 0.76, color: COLORS[2] },
  { top: '32%', left: '58%', size: 110, rotate: 14, opacity: 0.8, color: COLORS[3] },
  { top: '42%', right: '6%', size: 112, rotate: -12, opacity: 0.77, color: COLORS[4] },
  { top: '52%', left: '48%', size: 100, rotate: 28, opacity: 0.75, color: COLORS[5] },
  { top: '58%', left: '2%', size: 108, rotate: 6, opacity: 0.79, color: COLORS[6] },
  { top: '68%', right: '4%', size: 106, rotate: -24, opacity: 0.78, color: COLORS[7] },
  { top: '76%', left: '52%', size: 98, rotate: 10, opacity: 0.74, color: COLORS[8] },
  { top: '84%', left: '8%', size: 102, rotate: -16, opacity: 0.76, color: COLORS[9] },
]

const BACK_SPOTS: Spot[] = [
  { top: '4%', left: '2%', size: 112, rotate: -22, opacity: 0.8, color: COLORS[1] },
  { top: '10%', right: '3%', size: 100, rotate: 18, opacity: 0.76, color: COLORS[0] },
  { top: '22%', left: '6%', size: 96, rotate: 8, opacity: 0.74, color: COLORS[2] },
  { top: '30%', right: '8%', size: 92, rotate: -35, opacity: 0.72, color: COLORS[3] },
  { top: '44%', right: '2%', size: 108, rotate: -10, opacity: 0.77, color: COLORS[4] },
  { top: '58%', left: '4%', size: 104, rotate: 28, opacity: 0.75, color: COLORS[5] },
  { top: '72%', right: '6%', size: 98, rotate: -18, opacity: 0.78, color: COLORS[6] },
]

const COVER_SPOTS: Spot[] = [
  { top: '5%', right: '4%', size: 108, rotate: 16, opacity: 0.78, color: COLORS[7] },
  { top: '12%', left: '55%', size: 96, rotate: -12, opacity: 0.74, color: COLORS[8] },
  { top: '28%', right: '2%', size: 104, rotate: -20, opacity: 0.76, color: COLORS[0] },
  { top: '40%', left: '3%', size: 100, rotate: 8, opacity: 0.75, color: COLORS[1] },
  { top: '55%', right: '10%', size: 106, rotate: 24, opacity: 0.77, color: COLORS[2] },
  { top: '68%', left: '8%', size: 94, rotate: -8, opacity: 0.73, color: COLORS[3] },
  { top: '78%', right: '5%', size: 102, rotate: -28, opacity: 0.76, color: COLORS[4] },
  { top: '88%', left: '45%', size: 90, rotate: 12, opacity: 0.72, color: COLORS[5] },
]

type Props = {
  monthIndex: number
  variant?: 'front' | 'back' | 'cover'
}

export function FootprintDecor({ monthIndex, variant = 'front' }: Props) {
  const pool = variant === 'front' ? FRONT_SPOTS : variant === 'back' ? BACK_SPOTS : COVER_SPOTS
  const shift = (monthIndex * 2 + (variant === 'back' ? 3 : variant === 'cover' ? 5 : 0)) % pool.length
  const count = variant === 'cover' ? 8 : variant === 'back' ? 7 : 10
  const items = [...pool.slice(shift), ...pool.slice(0, shift)].slice(0, count)
  const [tinted, setTinted] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const entries = await Promise.all(
        COLORS.map(async (color) => [color, await tintedFootprintDataUrl(color)] as const),
      )
      if (!cancelled) setTinted(Object.fromEntries(entries))
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className={`footprint-decor variant-${variant}`} aria-hidden="true">
      {items.map((item, index) => (
        <img
          key={index}
          className="footprint footprint-image"
          src={tinted[item.color] ?? footprintUrl}
          alt=""
          draggable={false}
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            width: item.size,
            height: item.size,
            transform: `rotate(${item.rotate + (index % 2 === 0 ? 0 : 5)}deg)`,
            opacity: item.opacity,
          }}
        />
      ))}
    </div>
  )
}
