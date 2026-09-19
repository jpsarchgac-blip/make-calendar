import { MONTHS_JA } from './types'

export type CalendarMonth = {
  year: number
  monthIndex: number
}

/** slot 0 = 開始月、slot 11 = 12か月目 */
export function calendarMonthForSlot(
  startYear: number,
  startMonth: number,
  slotIndex: number,
): CalendarMonth {
  const start = Math.max(1, Math.min(12, startMonth)) - 1
  const absolute = start + slotIndex
  return {
    year: startYear + Math.floor(absolute / 12),
    monthIndex: absolute % 12,
  }
}

export function periodCrossesYears(startYear: number, startMonth: number) {
  const first = calendarMonthForSlot(startYear, startMonth, 0)
  const last = calendarMonthForSlot(startYear, startMonth, 11)
  return first.year !== last.year
}

export function defaultPeriodLabel(startYear: number, startMonth = 1) {
  return formatPeriodLabel(startYear, startMonth)
}

export function formatPeriodLabel(startYear: number, startMonth: number) {
  const sm = Math.max(1, Math.min(12, startMonth))
  const end = calendarMonthForSlot(startYear, sm, 11)
  const em = end.monthIndex + 1
  if (startYear === end.year) {
    return sm === 1 && em === 12 ? `${startYear}年1月〜12月` : `${startYear}年${sm}月〜${em}月`
  }
  return `${startYear}年${sm}月〜${end.year}年${em}月`
}

export function slotNavLabel(startYear: number, startMonth: number, slotIndex: number) {
  const { year, monthIndex } = calendarMonthForSlot(startYear, startMonth, slotIndex)
  if (periodCrossesYears(startYear, startMonth)) {
    return `${String(year).slice(-2)}/${MONTHS_JA[monthIndex]}`
  }
  return MONTHS_JA[monthIndex]
}

export function holidayYearsForPeriod(startYear: number, startMonth: number) {
  const years = new Set<number>()
  for (let i = 0; i < 12; i += 1) {
    years.add(calendarMonthForSlot(startYear, startMonth, i).year)
  }
  return [...years].sort((a, b) => a - b)
}
