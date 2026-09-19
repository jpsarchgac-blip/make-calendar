import { defaultPeriodLabel } from './calendarPeriod'
import type { PhotoTransform } from './photoTransform'
import { defaultPhotoTransform } from './photoTransform'

export type EventKind = 'birthday' | 'bird' | 'anniversary' | 'schedule' | 'other'

export type PhotoLayout = 'hero' | 'strip' | 'trio'

export type ThemeId = 'leaf' | 'sky' | 'sun'

export type PageOrientation = 'portrait' | 'landscape'

export type CoverSlot = {
  photoId: string | null
  transform: PhotoTransform
}

export type CalendarEvent = {
  id: string
  title: string
  month: number
  day: number
  yearly: boolean
  year?: number
  color: string
  kind: EventKind
}

export type MonthDesign = {
  /** 月名の下に表示（空なら project.title） */
  pageTitle: string
  /** 表面カレンダー用（裏面とは別） */
  frontPhotoId: string | null
  frontPhotoTransform: PhotoTransform
  photoIds: [string | null, string | null, string | null]
  backPhotoTransforms: [PhotoTransform, PhotoTransform, PhotoTransform]
  layout: PhotoLayout
  caption: string
  /** 表面カレンダー下のメモ欄 */
  memo: string
}

export type Photo = {
  id: string
  dataUrl: string
  name: string
}

export type Project = {
  id: string
  /** 一覧に表示する名前 */
  name: string
  updatedAt: number
  title: string
  birdName: string
  /** カレンダー開始年（1枚目の月の年） */
  year: number
  /** カレンダー開始月 1〜12 */
  periodStartMonth: number
  /** 表紙フッター（カレンダーの期間など） */
  periodLabel: string
  showHolidays: boolean
  showKinenbi: boolean
  showSeasonalFood: boolean
  theme: ThemeId
  orientation: PageOrientation
  includeCover: boolean
  /** PDF：月の裏面を上下反転（長辺とじの両面印刷向け） */
  flipBackForDuplex: boolean
  coverSlots: CoverSlot[]
  coverBirdPhotoId: string | null
  coverBirdPhotoTransform: PhotoTransform
  events: CalendarEvent[]
  months: MonthDesign[]
}

/** A4 @ 96dpi 相当 */
export const A4_PORTRAIT = { width: 794, height: 1123 }
export const A4_LANDSCAPE = { width: 1123, height: 794 }

export const PAGE_WIDTH = A4_PORTRAIT.width
export const PAGE_HEIGHT = A4_PORTRAIT.height

export function pageDimensions(orientation: PageOrientation) {
  return orientation === 'landscape' ? A4_LANDSCAPE : A4_PORTRAIT
}

export const ORIENTATION_LABEL: Record<PageOrientation, string> = {
  portrait: 'たて（A4）',
  landscape: 'よこ（A4）',
}

export const MONTHS_JA = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
] as const

export const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

export const EVENT_KIND_LABEL: Record<EventKind, string> = {
  birthday: '誕生日',
  bird: 'インコの記念日',
  anniversary: '記念日',
  schedule: '予定',
  other: 'その他',
}

export const EVENT_KIND_ICON: Record<EventKind, string> = {
  birthday: '🎂',
  bird: '🐦',
  anniversary: '💐',
  schedule: '📅',
  other: '✨',
}

export const COLOR_SWATCHES = [
  '#c45c4a',
  '#d98a3b',
  '#c9a227',
  '#5d8f62',
  '#4a8fa3',
  '#6b6ea8',
  '#c46b8a',
  '#7a5a43',
]

export const THEME_LABEL: Record<ThemeId, string> = {
  leaf: '若葉',
  sky: 'そら',
  sun: 'ひまわり',
}

export function emptyMonths(): MonthDesign[] {
  return Array.from({ length: 12 }, () => ({
    pageTitle: '',
    frontPhotoId: null,
    frontPhotoTransform: defaultPhotoTransform(),
    photoIds: [null, null, null],
    backPhotoTransforms: [defaultPhotoTransform(), defaultPhotoTransform(), defaultPhotoTransform()],
    layout: 'hero',
    caption: '',
    memo: '',
  }))
}

export function createDefaultProject(year = 2027, name = '新しいカレンダー'): Project {
  return {
    id: crypto.randomUUID(),
    name,
    updatedAt: Date.now(),
    title: 'ことりカレンダー',
    birdName: '',
    year,
    periodStartMonth: 1,
    periodLabel: defaultPeriodLabel(year, 1),
    showHolidays: true,
    showKinenbi: true,
    showSeasonalFood: true,
    theme: 'leaf',
    orientation: 'portrait',
    includeCover: true,
    flipBackForDuplex: true,
    coverSlots: Array.from({ length: 6 }, () => ({
      photoId: null,
      transform: defaultPhotoTransform(),
    })),
    coverBirdPhotoId: null,
    coverBirdPhotoTransform: defaultPhotoTransform(),
    events: [],
    months: emptyMonths(),
  }
}
