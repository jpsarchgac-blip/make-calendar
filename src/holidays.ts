const EQUINOX: Record<number, { vernal: [number, number]; autumnal: [number, number] }> = {
  2024: { vernal: [3, 20], autumnal: [9, 22] },
  2025: { vernal: [3, 20], autumnal: [9, 23] },
  2026: { vernal: [3, 20], autumnal: [9, 23] },
  2027: { vernal: [3, 21], autumnal: [9, 23] },
  2028: { vernal: [3, 20], autumnal: [9, 22] },
  2029: { vernal: [3, 20], autumnal: [9, 23] },
  2030: { vernal: [3, 20], autumnal: [9, 23] },
  2031: { vernal: [3, 21], autumnal: [9, 23] },
  2032: { vernal: [3, 20], autumnal: [9, 22] },
  2033: { vernal: [3, 20], autumnal: [9, 23] },
  2034: { vernal: [3, 20], autumnal: [9, 23] },
  2035: { vernal: [3, 21], autumnal: [9, 23] },
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`
}

function nthWeekday(year: number, month: number, weekday: number, nth: number) {
  const first = new Date(year, month - 1, 1)
  const offset = (weekday - first.getDay() + 7) % 7
  return offset + 1 + (nth - 1) * 7
}

function equinox(year: number, season: 'vernal' | 'autumnal'): [number, number] {
  const known = EQUINOX[year]
  if (known) return season === 'vernal' ? known.vernal : known.autumnal
  const base = year - 1980
  if (season === 'vernal') {
    return [3, Math.floor(20.8431 + 0.242194 * base - Math.floor(base / 4))]
  }
  return [9, Math.floor(23.2488 + 0.242194 * base - Math.floor(base / 4))]
}

export function getJapaneseHolidays(year: number): Map<string, string> {
  const named = new Map<string, string>()
  const add = (month: number, day: number, name: string) => {
    named.set(dateKey(year, month, day), name)
  }

  add(1, 1, '元日')
  add(1, nthWeekday(year, 1, 1, 2), '成人の日')
  add(2, 11, '建国記念の日')
  add(2, 23, '天皇誕生日')
  const [vm, vd] = equinox(year, 'vernal')
  add(vm, vd, '春分の日')
  add(4, 29, '昭和の日')
  add(5, 3, '憲法記念日')
  add(5, 4, 'みどりの日')
  add(5, 5, 'こどもの日')
  add(7, nthWeekday(year, 7, 1, 3), '海の日')
  add(8, 11, '山の日')
  add(9, nthWeekday(year, 9, 1, 3), '敬老の日')
  const [am, ad] = equinox(year, 'autumnal')
  add(am, ad, '秋分の日')
  add(10, nthWeekday(year, 10, 1, 2), 'スポーツの日')
  add(11, 3, '文化の日')
  add(11, 23, '勤労感謝の日')

  const holidays = new Map(named)

  for (const [key, name] of named) {
    const [y, m, d] = key.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    if (date.getDay() !== 0) continue
    const next = new Date(y, m - 1, d + 1)
    while (holidays.has(dateKey(next.getFullYear(), next.getMonth() + 1, next.getDate()))) {
      next.setDate(next.getDate() + 1)
    }
    holidays.set(dateKey(next.getFullYear(), next.getMonth() + 1, next.getDate()), `${name}の振替休日`)
  }

  const daysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365
  const cursor = new Date(year, 0, 1)
  for (let i = 0; i < daysInYear; i += 1) {
    const prev = new Date(cursor)
    prev.setDate(prev.getDate() - 1)
    const next = new Date(cursor)
    next.setDate(next.getDate() + 1)
    const key = dateKey(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate())
    const prevKey = dateKey(prev.getFullYear(), prev.getMonth() + 1, prev.getDate())
    const nextKey = dateKey(next.getFullYear(), next.getMonth() + 1, next.getDate())
    if (!holidays.has(key) && holidays.has(prevKey) && holidays.has(nextKey) && cursor.getDay() !== 0) {
      holidays.set(key, '国民の休日')
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return holidays
}
