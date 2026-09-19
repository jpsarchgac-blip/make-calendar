import { SEASONAL_FOODS_BY_MONTH } from '../data/seasonalFoods'
import {
  EVENT_KIND_ICON,
  MONTHS_EN,
  MONTHS_JA,
  WEEKDAYS,
  pageDimensions,
  type CalendarEvent,
  type PageOrientation,
  type Photo,
} from '../types'
import { buildMonthGrid, eventsForMonth } from '../calendar'
import type { KinenbiMap } from '../kinenbi'
import type { PhotoTransform } from '../photoTransform'
import { MonthLeafSprig } from './Birds'
import { FootprintDecor } from './FootprintDecor'
import { FramedPhoto } from './FramedPhoto'

type Props = {
  year: number
  monthIndex: number
  title: string
  pageTitle: string
  birdName: string
  orientation: PageOrientation
  holidays: Map<string, string>
  kinenbi: KinenbiMap
  showKinenbi: boolean
  showSeasonalFood: boolean
  events: CalendarEvent[]
  photos: Photo[]
  frontPhotoId: string | null
  frontPhotoTransform: PhotoTransform
  memo: string
  onDateClick?: (month: number, day: number) => void
  onCropFront?: () => void
}

export function CalendarFront({
  year,
  monthIndex,
  title,
  pageTitle,
  birdName,
  orientation,
  holidays,
  kinenbi,
  showKinenbi,
  showSeasonalFood,
  events,
  photos,
  frontPhotoId,
  frontPhotoTransform,
  memo,
  onDateClick,
  onCropFront,
}: Props) {
  const { width, height } = pageDimensions(orientation)
  const cells = buildMonthGrid(year, monthIndex, holidays, kinenbi, events)
  const monthEvents = eventsForMonth(events, year, monthIndex)
  const frontPhoto = photos.find((photo) => photo.id === frontPhotoId)
  const seasonal = SEASONAL_FOODS_BY_MONTH[monthIndex + 1]

  return (
    <article
      className={`sheet sheet-front orient-${orientation}`}
      style={{ width, height }}
    >
      <div className="sheet-grain" />
      <FootprintDecor monthIndex={monthIndex} variant="front" />
      {frontPhoto ? (
        <div className="front-bg-photo" aria-hidden="true">
          <FramedPhoto src={frontPhoto.dataUrl} transform={frontPhotoTransform} />
        </div>
      ) : null}

      <div className="front-content">
        <div className="front-aside">
          <header className="front-header compact">
            <div className="front-heading">
              <p className="front-year">{year}</p>
              <p className="front-month-en">{MONTHS_EN[monthIndex]}</p>
              <h1 className="front-month-ja">{MONTHS_JA[monthIndex]}</h1>
              <p className="front-title">{pageTitle.trim() || title}</p>
              {birdName ? <p className="front-bird-name">{birdName} と過ごすひと月</p> : null}
            </div>
          </header>
          <MonthLeafSprig monthIndex={monthIndex} className="front-sprig" />

          {showSeasonalFood && seasonal ? (
            <section className="seasonal-strip">
              <div className="seasonal-text">
                <p className="seasonal-label">{seasonal.label}</p>
                <p className="seasonal-items">{seasonal.items.join(' · ')}</p>
                {orientation !== 'landscape' ? <p className="seasonal-tip">{seasonal.tip}</p> : null}
              </div>
              {orientation === 'landscape' && frontPhoto ? (
                <div
                  className={`seasonal-front-photo${onCropFront ? ' croppable' : ''}`}
                  onClick={(e) => {
                    if (!onCropFront) return
                    e.stopPropagation()
                    onCropFront()
                  }}
                >
                  <FramedPhoto src={frontPhoto.dataUrl} transform={frontPhotoTransform} />
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="front-main">
          <div className="weekday-row">
            {WEEKDAYS.map((label, index) => (
              <span key={label} className={index === 0 ? 'sun' : index === 6 ? 'sat' : undefined}>
                {label}
              </span>
            ))}
          </div>

          <div className="date-grid">
            {cells.map((cell, index) => {
              const isPublicHoliday = Boolean(cell.holiday)
              const hasUserEvents = cell.events.length > 0
              const showKinenbiLine =
                cell.inMonth && showKinenbi && Boolean(cell.kinenbi[0]) && !hasUserEvents
              const eventLimit = showKinenbiLine ? 1 : 2
              const holidayish = isPublicHoliday || cell.weekday === 0
              const classes = [
                'date-cell',
                cell.inMonth ? '' : 'outside',
                holidayish ? 'sunday' : '',
                cell.weekday === 6 ? 'saturday' : '',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <div
                  key={`${cell.year}-${cell.month}-${cell.day}-${index}`}
                  className={`${classes}${onDateClick && cell.inMonth ? ' clickable' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onDateClick && cell.inMonth) onDateClick(cell.month, cell.day)
                  }}
                >
                  <span className="date-num">{cell.day}</span>
                  {cell.inMonth && cell.holiday ? <span className="date-holiday">{cell.holiday}</span> : null}
                  {showKinenbiLine ? (
                    <span className="date-kinenbi" title={cell.kinenbi.join('、')}>
                      {cell.kinenbi[0]}
                    </span>
                  ) : null}
                  {cell.inMonth && cell.events.length > 0 ? (
                    <div className="date-cell-events">
                      {cell.events.slice(0, eventLimit).map((event) => (
                        <span key={event.id} className="date-event" style={{ background: event.color }}>
                          {EVENT_KIND_ICON[event.kind]} {event.title}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <footer className={`front-footer${monthEvents.length === 0 ? ' footer-memo-only' : ''}`}>
          {monthEvents.length > 0 ? (
            <div className="footer-block footer-events-compact">
              <h2>この月の予定</h2>
              <ul>
                {monthEvents.map((event) => (
                  <li key={event.id}>
                    <span className="event-day">{event.day}日</span>
                    <span className="event-dot" style={{ background: event.color }} />
                    <span className="footer-event-title">
                      {EVENT_KIND_ICON[event.kind]} {event.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="footer-block footer-memo">
            <h2>メモ</h2>
            <div className={`memo-pad${memo.trim() ? ' has-text' : ''}`}>{memo.trim() ? memo : null}</div>
          </div>
        </footer>
      </div>
      {frontPhoto && onCropFront ? (
        <button
          type="button"
          className="sheet-crop-btn"
          onClick={(e) => {
            e.stopPropagation()
            onCropFront()
          }}
        >
          背景をトリミング
        </button>
      ) : null}
    </article>
  )
}
