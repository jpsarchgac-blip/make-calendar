import type { KinenbiMap } from './kinenbi'
import { getKinenbiForDay } from './kinenbi'
import type { CalendarEvent } from './types'
import { dateKey } from './holidays'

export type CalendarCell = {
  year: number
  month: number
  day: number
  inMonth: boolean
  weekday: number
  holiday?: string
  kinenbi: string[]
  events: CalendarEvent[]
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export function buildMonthGrid(
  year: number,
  monthIndex: number,
  holidays: Map<string, string>,
  kinenbi: KinenbiMap,
  events: CalendarEvent[],
): CalendarCell[] {
  const month = monthIndex + 1
  const first = new Date(year, monthIndex, 1)
  const startWeekday = first.getDay()
  const count = daysInMonth(year, month)
  const cells: CalendarCell[] = []

  for (let i = 0; i < startWeekday; i += 1) {
    const date = new Date(year, monthIndex, 1 - startWeekday + i)
    cells.push(makeCell(date, false, holidays, kinenbi, events))
  }

  for (let day = 1; day <= count; day += 1) {
    cells.push(makeCell(new Date(year, monthIndex, day), true, holidays, kinenbi, events))
  }

  while (cells.length % 7 !== 0) {
    const extra = cells.length - startWeekday - count + 1
    cells.push(makeCell(new Date(year, monthIndex, count + extra), false, holidays, kinenbi, events))
  }

  while (cells.length < 42) {
    const extra = cells.length - startWeekday - count + 1
    cells.push(makeCell(new Date(year, monthIndex, count + extra), false, holidays, kinenbi, events))
  }

  return cells
}

function makeCell(
  date: Date,
  inMonth: boolean,
  holidays: Map<string, string>,
  kinenbi: KinenbiMap,
  events: CalendarEvent[],
): CalendarCell {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return {
    year,
    month,
    day,
    inMonth,
    weekday: date.getDay(),
    holiday: holidays.get(dateKey(year, month, day)),
    kinenbi: getKinenbiForDay(kinenbi, month, day),
    events: events.filter((event) => matchesEvent(event, year, month, day)),
  }
}

export function kinenbiDaysForMonth(kinenbi: KinenbiMap, monthIndex: number) {
  const month = monthIndex + 1
  const lastDay = daysInMonth(2024, month)
  const rows: { day: number; items: string[] }[] = []
  for (let day = 1; day <= lastDay; day += 1) {
    const items = getKinenbiForDay(kinenbi, month, day)
    if (items.length) rows.push({ day, items })
  }
  return rows
}

export function matchesEvent(event: CalendarEvent, year: number, month: number, day: number) {
  if (event.month !== month) return false
  if (event.day !== day) return false
  if (event.yearly) return true
  return event.year === year
}

export function eventsForMonth(events: CalendarEvent[], year: number, monthIndex: number) {
  const month = monthIndex + 1
  const lastDay = daysInMonth(year, month)
  return events
    .filter((event) => event.month === month && event.day >= 1 && event.day <= lastDay)
    .filter((event) => event.yearly || event.year === year)
    .sort((a, b) => a.day - b.day || a.title.localeCompare(b.title, 'ja'))
}
