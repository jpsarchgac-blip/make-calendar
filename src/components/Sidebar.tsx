import { useEffect, useRef, useState } from 'react'
import {
  COLOR_SWATCHES,
  EVENT_KIND_ICON,
  EVENT_KIND_LABEL,
  MONTHS_JA,
  ORIENTATION_LABEL,
  type PageOrientation,
  type CalendarEvent,
  type EventKind,
  type MonthDesign,
  type Photo,
  type PhotoLayout,
  type Project,
} from '../types'
import { eventsForMonth } from '../calendar'
import { calendarMonthForSlot, formatPeriodLabel, slotNavLabel } from '../calendarPeriod'
import { resolveCoverPhoto } from '../coverPhotos'
import { pickImageFolder } from '../folderImport'
import type { PhotoTransform } from '../photoTransform'
import { PhotoFrameEditor } from './PhotoFrameEditor'
import { PhotoLibraryModal } from './PhotoLibraryModal'

type DraftEvent = {
  title: string
  month: number
  day: number
  yearly: boolean
  kind: EventKind
  color: string
}

type SidebarTab = 'basic' | 'month' | 'cover' | 'events'
type MonthPart = 'front' | 'back'
type LibraryTarget =
  | { kind: 'front' }
  | { kind: 'back'; slot: 0 | 1 | 2 }
  | { kind: 'cover'; slot: number }
  | { kind: 'coverBird' }

const emptyDraft = (monthIndex: number): DraftEvent => ({
  title: '',
  month: monthIndex + 1,
  day: 1,
  yearly: true,
  kind: 'birthday',
  color: COLOR_SWATCHES[0],
})

type Props = {
  project: Project
  photos: Photo[]
  monthIndex: number
  busy: boolean
  onBackToList: () => void
  onProjectChange: (patch: Partial<Project>) => void
  onMonthChange: (monthIndex: number, patch: Partial<MonthDesign>) => void
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void
  onUpdateEvent: (event: CalendarEvent) => void
  onRemoveEvent: (id: string) => void
  onUploadToSlot: (slot: 0 | 1 | 2, files: FileList | File[]) => void
  onAssignPhoto: (slot: 0 | 1 | 2, photoId: string | null) => void
  onUploadFrontPhoto: (files: FileList | File[]) => void
  onAssignFrontPhoto: (photoId: string | null) => void
  onUploadCoverSlot: (slot: number, files: FileList | File[]) => void
  onAssignCoverSlot: (slot: number, photoId: string | null) => void
  onCoverTransformChange: (slot: number, transform: PhotoTransform) => void
  onUploadCoverBirdPhoto: (files: FileList | File[]) => void
  onAssignCoverBirdPhoto: (photoId: string | null) => void
  onCoverBirdTransformChange: (transform: PhotoTransform) => void
  kinenbiCount: number
  onExport: () => void
  onImportPhotoFolder: (files: FileList | File[]) => void
  onOpenPhotoBoard: () => void
  onPrefillEvent?: DraftEvent | null
  onClearPrefill?: () => void
}

export function Sidebar({
  project,
  photos,
  monthIndex,
  busy,
  onBackToList,
  onProjectChange,
  onMonthChange,
  onAddEvent,
  onUpdateEvent,
  onRemoveEvent,
  onUploadToSlot,
  onAssignPhoto,
  onUploadFrontPhoto,
  onAssignFrontPhoto,
  onUploadCoverSlot,
  onAssignCoverSlot,
  onCoverTransformChange,
  onUploadCoverBirdPhoto,
  onAssignCoverBirdPhoto,
  onCoverBirdTransformChange,
  kinenbiCount,
  onExport,
  onImportPhotoFolder,
  onOpenPhotoBoard,
  onPrefillEvent,
  onClearPrefill,
}: Props) {
  const [tab, setTab] = useState<SidebarTab>('month')
  const [monthPart, setMonthPart] = useState<MonthPart>('front')
  const [draft, setDraft] = useState<DraftEvent>(() => emptyDraft(monthIndex))
  const [library, setLibrary] = useState<LibraryTarget | null>(null)
  const [coverEditIndex, setCoverEditIndex] = useState(0)
  const batchRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  function bindFolderInput(input: HTMLInputElement | null) {
    folderInputRef.current = input
    if (!input) return
    input.setAttribute('webkitdirectory', 'true')
    input.setAttribute('directory', 'true')
    input.setAttribute('multiple', 'true')
  }

  async function choosePhotoFolder() {
    try {
      const fromPicker = await pickImageFolder()
      if (fromPicker === null) {
        folderInputRef.current?.click()
        return
      }
      if (fromPicker.length) onImportPhotoFolder(fromPicker)
    } catch (error) {
      console.error(error)
      folderInputRef.current?.click()
    }
  }
  const month = project.months[monthIndex]
  const startMonth = project.periodStartMonth ?? 1
  const slotCal = calendarMonthForSlot(project.year, startMonth, monthIndex)
  const monthEvents = eventsForMonth(project.events, slotCal.year, slotCal.monthIndex)

  const tabs: { id: SidebarTab; label: string }[] = [
    { id: 'basic', label: '基本' },
    { id: 'month', label: slotNavLabel(project.year, startMonth, monthIndex) },
    ...(project.includeCover ? [{ id: 'cover' as SidebarTab, label: '表紙' }] : []),
    { id: 'events', label: '予定' },
  ]

  useEffect(() => {
    const cal = calendarMonthForSlot(project.year, project.periodStartMonth ?? 1, monthIndex)
    setDraft((current) => ({ ...current, month: cal.monthIndex + 1 }))
  }, [monthIndex, project.year, project.periodStartMonth])

  useEffect(() => {
    if (!onPrefillEvent || onPrefillEvent.title !== '__date__') return
    setDraft((current) => ({ ...current, month: onPrefillEvent.month, day: onPrefillEvent.day }))
    setTab('events')
    onClearPrefill?.()
  }, [onPrefillEvent, onClearPrefill])

  function submitEvent(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.title.trim()) return
    onAddEvent({
      title: draft.title.trim(),
      month: draft.month,
      day: draft.day,
      yearly: draft.yearly,
      year: draft.yearly ? undefined : project.year,
      kind: draft.kind,
      color: draft.color,
    })
    setDraft(emptyDraft(monthIndex))
  }

  function pickFromLibrary(photoId: string) {
    if (!library) return
    if (library.kind === 'front') onAssignFrontPhoto(photoId)
    else if (library.kind === 'back') onAssignPhoto(library.slot, photoId)
    else if (library.kind === 'coverBird') onAssignCoverBirdPhoto(photoId)
    else onAssignCoverSlot(library.slot, photoId)
    setLibrary(null)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-scroll">
        <div className="brand">
          <button type="button" className="brand-back ghost" onClick={onBackToList}>
            ← カレンダー一覧
          </button>
          <p className="brand-kicker">誰かに思い出のカレンダーを贈りませんか？</p>
          <h1>カレンダー工房</h1>
        </div>

        <nav className="sidebar-tabs" aria-label="編集メニュー">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? 'picked' : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === 'basic' ? (
          <section className="panel">
            <h2>カレンダーの基本</h2>
            <div className="folder-import-panel">
              <h3>写真フォルダから自動作成</h3>
              <p className="hint">
                フォルダを選ぶと、中の画像をファイル名順に読み込み、表紙と12か月分（表面の背景＋裏面3枚）へ自動で並べます。
              </p>
              <div className="folder-import-actions">
                <button
                  type="button"
                  className="primary"
                  disabled={busy}
                  onClick={() => {
                    choosePhotoFolder().catch(() => undefined)
                  }}
                >
                  {busy ? '取り込み中…' : 'フォルダを選択'}
                </button>
                <button type="button" className="ghost" onClick={onOpenPhotoBoard}>
                  写真のラベルを付ける
                </button>
              </div>
            </div>
            <label>
              一覧での名前
              <input
                value={project.name}
                onChange={(e) => onProjectChange({ name: e.target.value })}
                placeholder="例：おばあちゃんへのプレゼント"
              />
            </label>
            <label>
              カレンダー名（表紙・共通タイトル）
              <input
                value={project.title}
                onChange={(e) => onProjectChange({ title: e.target.value })}
                placeholder="ことりカレンダー"
              />
            </label>
            <label>
              インコの名前
              <input
                value={project.birdName}
                onChange={(e) => onProjectChange({ birdName: e.target.value })}
                placeholder="ぴーちゃん"
              />
            </label>
            <p className="hint">
              12か月分の期間: <strong>{formatPeriodLabel(project.year, startMonth)}</strong>
            </p>
            <div className="row-2">
              <label>
                開始年
                <input
                  type="number"
                  min={2024}
                  max={2035}
                  value={project.year}
                  onChange={(e) => {
                    const year = Number(e.target.value) || project.year
                    onProjectChange({
                      year,
                      periodLabel: formatPeriodLabel(year, startMonth),
                    })
                  }}
                />
              </label>
              <label>
                開始月
                <select
                  value={startMonth}
                  onChange={(e) => {
                    const periodStartMonth = Number(e.target.value) || 1
                    onProjectChange({
                      periodStartMonth,
                      periodLabel: formatPeriodLabel(project.year, periodStartMonth),
                    })
                  }}
                >
                  {MONTHS_JA.map((label, index) => (
                    <option key={label} value={index + 1}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              表紙に表示する期間
              <input
                value={project.periodLabel}
                onChange={(e) => onProjectChange({ periodLabel: e.target.value })}
                placeholder={formatPeriodLabel(project.year, startMonth)}
              />
            </label>
            <label>
              用紙の向き
              <select
                value={project.orientation}
                onChange={(e) => onProjectChange({ orientation: e.target.value as PageOrientation })}
              >
                {(Object.keys(ORIENTATION_LABEL) as PageOrientation[]).map((id) => (
                  <option key={id} value={id}>
                    {ORIENTATION_LABEL[id]}
                  </option>
                ))}
              </select>
            </label>
            <details className="options-fold" open>
              <summary>表示オプション</summary>
              <label className="check">
                <input
                  type="checkbox"
                  checked={project.showHolidays}
                  onChange={(e) => onProjectChange({ showHolidays: e.target.checked })}
                />
                日本の祝日を赤で入れる
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={project.showKinenbi}
                  onChange={(e) => onProjectChange({ showKinenbi: e.target.checked })}
                />
                何の日を日付に表示（{kinenbiCount}日分・予定がある日は非表示）
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={project.showSeasonalFood}
                  onChange={(e) => onProjectChange({ showSeasonalFood: e.target.checked })}
                />
                旬の食材を月ごとに表示
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={project.includeCover}
                  onChange={(e) => onProjectChange({ includeCover: e.target.checked })}
                />
                PDFの先頭に表紙を付ける
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={project.flipBackForDuplex}
                  onChange={(e) => onProjectChange({ flipBackForDuplex: e.target.checked })}
                />
                PDFの裏面を上下反転（長辺とじの両面印刷）
              </label>
            </details>
          </section>
        ) : null}

        {tab === 'month' ? (
          <section className="panel">
            <div className="sub-tabs">
              <button
                type="button"
                className={monthPart === 'front' ? 'picked' : undefined}
                onClick={() => setMonthPart('front')}
              >
                表面
              </button>
              <button
                type="button"
                className={monthPart === 'back' ? 'picked' : undefined}
                onClick={() => setMonthPart('back')}
              >
                裏面
              </button>
            </div>

            {monthPart === 'front' ? (
              <>
                <h2>
                  {slotCal.year}年{MONTHS_JA[slotCal.monthIndex]}の表面
                </h2>
                <label>
                  月の下のタイトル
                  <input
                    value={month.pageTitle}
                    onChange={(e) => onMonthChange(monthIndex, { pageTitle: e.target.value })}
                    placeholder={`空なら「${project.title}」`}
                  />
                </label>
                <p className="hint">カレンダー背景に半透明で表示。よこ向きでは旬の食材枠にも大きく出ます。</p>
                <div className="front-photo-slot">
                  {(() => {
                    const photo = photos.find((item) => item.id === month.frontPhotoId)
                    return photo ? <img src={photo.dataUrl} alt="" /> : <span>表面用の写真</span>
                  })()}
                  <input
                    id="photo-slot-front"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.length) onUploadFrontPhoto(e.target.files)
                      e.target.value = ''
                    }}
                  />
                  <label className="slot-hit" htmlFor="photo-slot-front">
                    <span className="sr-only">表面用の写真を選ぶ</span>
                  </label>
                  <div className="slot-actions">
                    <button type="button" onClick={() => setLibrary({ kind: 'front' })}>ライブラリ</button>
                    {month.frontPhotoId ? (
                      <button type="button" onClick={() => onAssignFrontPhoto(null)}>外す</button>
                    ) : null}
                  </div>
                </div>
                <PhotoFrameEditor
                  label="背景写真の見え方"
                  photo={photos.find((item) => item.id === month.frontPhotoId) ?? null}
                  transform={month.frontPhotoTransform}
                  onChange={(transform) => onMonthChange(monthIndex, { frontPhotoTransform: transform })}
                  previewClassName="frame-preview-wide"
                />
                <label>
                  メモ欄（カレンダー下）
                  <textarea
                    rows={3}
                    value={month.memo}
                    onChange={(e) => onMonthChange(monthIndex, { memo: e.target.value })}
                    placeholder="贈る相手へのひとこと、うちの子の近況など"
                  />
                </label>
              </>
            ) : (
              <>
                <h2>
                  {slotCal.year}年{MONTHS_JA[slotCal.monthIndex]}の裏面
                </h2>
                <p className="hint">めくったときの写真3枚ページです。</p>
                <div className="layout-picks">
                  {(
                    [
                      ['hero', '大＋2'],
                      ['strip', '横3段'],
                      ['trio', '縦3列'],
                    ] as [PhotoLayout, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={month.layout === id ? 'picked' : undefined}
                      onClick={() => onMonthChange(monthIndex, { layout: id })}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="photo-slots">
                  {([0, 1, 2] as const).map((slot) => {
                    const photo = photos.find((item) => item.id === month.photoIds[slot])
                    const inputId = `photo-slot-${slot}`
                    return (
                      <div key={slot} className="photo-slot">
                        {photo ? <img src={photo.dataUrl} alt="" /> : <span>{slot + 1}</span>}
                        <input
                          id={inputId}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.length) onUploadToSlot(slot, e.target.files)
                            e.target.value = ''
                          }}
                        />
                        <label className="slot-hit" htmlFor={inputId}>
                          <span className="sr-only">{slot + 1}枚目の写真を選ぶ</span>
                        </label>
                        <div className="slot-actions">
                          <button type="button" onClick={() => setLibrary({ kind: 'back', slot })}>ライブラリ</button>
                          {photo ? (
                            <button type="button" onClick={() => onAssignPhoto(slot, null)}>外す</button>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {([0, 1, 2] as const).map((slot) => (
                  <PhotoFrameEditor
                    key={slot}
                    label={`裏面 ${slot + 1} のトリミング`}
                    photo={photos.find((item) => item.id === month.photoIds[slot]) ?? null}
                    transform={month.backPhotoTransforms?.[slot] ?? { scale: 1, x: 50, y: 50 }}
                    onChange={(transform) => {
                      const current = month.backPhotoTransforms ?? [
                        { scale: 1, x: 50, y: 50 },
                        { scale: 1, x: 50, y: 50 },
                        { scale: 1, x: 50, y: 50 },
                      ]
                      const backPhotoTransforms = [...current] as typeof month.backPhotoTransforms
                      backPhotoTransforms[slot] = transform
                      onMonthChange(monthIndex, { backPhotoTransforms })
                    }}
                    previewClassName="frame-preview-polaroid"
                  />
                ))}
                <button type="button" className="ghost" onClick={() => batchRef.current?.click()}>
                  3枚まとめて入れる
                </button>
                <input
                  ref={batchRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    const files = e.target.files
                    if (!files?.length) return
                    ;([0, 1, 2] as const).forEach((slot) => {
                      if (files[slot]) onUploadToSlot(slot, [files[slot]])
                    })
                    e.target.value = ''
                  }}
                />
                <label>
                  裏面の一言
                  <input
                    value={month.caption}
                    onChange={(e) => onMonthChange(monthIndex, { caption: e.target.value })}
                    placeholder={`${project.birdName || 'うちの子'}の${MONTHS_JA[slotCal.monthIndex]}`}
                  />
                </label>
              </>
            )}
          </section>
        ) : null}

        {tab === 'cover' && project.includeCover ? (
          <section className="panel">
            <h2>表紙のメイン写真</h2>
            <p className="hint">タイトル下のイラスト枠。未設定のときはことりの絵が出ます。</p>
            <div className="front-photo-slot">
              {(() => {
                const photo = photos.find((item) => item.id === project.coverBirdPhotoId)
                return photo ? <img src={photo.dataUrl} alt="" /> : <span>うちの子の写真</span>
              })()}
              <input
                id="photo-cover-bird"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.length) onUploadCoverBirdPhoto(e.target.files)
                  e.target.value = ''
                }}
              />
              <label className="slot-hit" htmlFor="photo-cover-bird">
                <span className="sr-only">表紙メイン写真を選ぶ</span>
              </label>
              <div className="slot-actions">
                <button type="button" onClick={() => setLibrary({ kind: 'coverBird' })}>ライブラリ</button>
                {project.coverBirdPhotoId ? (
                  <button type="button" onClick={() => onAssignCoverBirdPhoto(null)}>外す</button>
                ) : null}
              </div>
            </div>
            <PhotoFrameEditor
              label="メイン写真の見え方"
              photo={photos.find((item) => item.id === project.coverBirdPhotoId) ?? null}
              transform={project.coverBirdPhotoTransform}
              onChange={onCoverBirdTransformChange}
              previewClassName="frame-preview-polaroid"
            />
            <label>
              カレンダーの期間（表紙の下）
              <input
                value={project.periodLabel}
                onChange={(e) => onProjectChange({ periodLabel: e.target.value })}
                placeholder={formatPeriodLabel(project.year, startMonth)}
              />
            </label>
            <h2>表紙の写真（6枚）</h2>
            <p className="hint">未設定の枠は月の写真から自動で並びます。</p>
            <div className="cover-slot-picks">
              {Array.from({ length: 6 }, (_, index) => {
                const photo = resolveCoverPhoto(project, photos, index)
                return (
                  <button
                    key={index}
                    type="button"
                    className={coverEditIndex === index ? 'picked' : undefined}
                    onClick={() => setCoverEditIndex(index)}
                  >
                    {photo ? <img src={photo.dataUrl} alt="" /> : <span>{index + 1}</span>}
                  </button>
                )
              })}
            </div>
            <div className="cover-slot-actions row-2">
              <label className="ghost file-label">
                写真を選ぶ
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.length) onUploadCoverSlot(coverEditIndex, e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
              <button type="button" className="ghost" onClick={() => setLibrary({ kind: 'cover', slot: coverEditIndex })}>
                ライブラリ
              </button>
            </div>
            {project.coverSlots[coverEditIndex]?.photoId ? (
              <button type="button" className="ghost compact" onClick={() => onAssignCoverSlot(coverEditIndex, null)}>
                専用写真を外す（自動に戻す）
              </button>
            ) : null}
            <PhotoFrameEditor
              label={`${coverEditIndex + 1}枚目の見え方`}
              photo={resolveCoverPhoto(project, photos, coverEditIndex)}
              transform={project.coverSlots[coverEditIndex]?.transform ?? { scale: 1, x: 50, y: 50 }}
              onChange={(transform) => onCoverTransformChange(coverEditIndex, transform)}
              previewClassName="frame-preview-polaroid"
            />
          </section>
        ) : null}

        {tab === 'events' ? (
          <section className="panel">
            <h2>イベント</h2>
            <p className="hint">プレビューの日付をクリックしても追加できます。</p>
            <form className="event-form" onSubmit={submitEvent}>
              <label>
                なまえ
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="ぴーちゃんの誕生日"
                />
              </label>
              <div className="row-3">
                <label>
                  月
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={draft.month}
                    onChange={(e) => setDraft({ ...draft, month: Number(e.target.value) })}
                  />
                </label>
                <label>
                  日
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={draft.day}
                    onChange={(e) => setDraft({ ...draft, day: Number(e.target.value) })}
                  />
                </label>
                <label>
                  種類
                  <select
                    value={draft.kind}
                    onChange={(e) => setDraft({ ...draft, kind: e.target.value as EventKind })}
                  >
                    {(Object.keys(EVENT_KIND_LABEL) as EventKind[]).map((kind) => (
                      <option key={kind} value={kind}>
                        {EVENT_KIND_ICON[kind]} {EVENT_KIND_LABEL[kind]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="swatches">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={draft.color === color ? 'picked' : undefined}
                    style={{ background: color }}
                    aria-label={color}
                    onClick={() => setDraft({ ...draft, color })}
                  />
                ))}
              </div>
              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.yearly}
                  onChange={(e) => setDraft({ ...draft, yearly: e.target.checked })}
                />
                毎年くり返す
              </label>
              <button type="submit" className="primary">追加</button>
            </form>
            <ul className="event-list">
              {monthEvents.map((event) => (
                <li key={event.id}>
                  <span>{event.day}日 {EVENT_KIND_ICON[event.kind]} {event.title}</span>
                  <button type="button" onClick={() => onRemoveEvent(event.id)}>削除</button>
                </li>
              ))}
            </ul>
            {project.events.filter((event) => event.month !== monthIndex + 1).length > 0 ? (
              <details className="other-events">
                <summary>ほかの月</summary>
                <ul className="event-list">
                  {project.events
                    .slice()
                    .sort((a, b) => a.month - b.month || a.day - b.day)
                    .filter((event) => event.month !== monthIndex + 1)
                    .map((event) => (
                      <li key={event.id}>
                        <span>
                          {event.month}/{event.day} {EVENT_KIND_ICON[event.kind]} {event.title}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateEvent({
                              ...event,
                              yearly: !event.yearly,
                              year: event.yearly ? project.year : undefined,
                            })
                          }
                        >
                          {event.yearly ? '毎年' : `${event.year}のみ`}
                        </button>
                        <button type="button" onClick={() => onRemoveEvent(event.id)}>削除</button>
                      </li>
                    ))}
                </ul>
              </details>
            ) : null}
          </section>
        ) : null}
      </div>

      <div className="sidebar-footer">
        <input
          ref={bindFolderInput}
          type="file"
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const picked = e.target.files ? [...e.target.files] : []
            e.target.value = ''
            if (picked.length) onImportPhotoFolder(picked)
          }}
        />
        <button type="button" className="primary export" disabled={busy} onClick={onExport}>
          {busy ? 'PDFを作っています…' : `${ORIENTATION_LABEL[project.orientation]} PDF`}
        </button>
        <p className="hint">
          表紙ありのときは表紙の次に白紙1枚を入れます。裏面の反転は上の表示オプションで変更できます。
        </p>
      </div>

      <PhotoLibraryModal
        open={library !== null}
        title={
          library?.kind === 'front'
            ? '表面用写真'
            : library?.kind === 'coverBird'
              ? '表紙メイン写真'
              : library?.kind === 'cover'
                ? '表紙用写真'
                : '裏面用写真'
        }
        photos={photos}
        onClose={() => setLibrary(null)}
        onPick={pickFromLibrary}
      />
    </aside>
  )
}
