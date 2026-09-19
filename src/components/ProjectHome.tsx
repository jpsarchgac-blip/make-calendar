import { type CSSProperties } from 'react'
import { formatPeriodLabel } from '../calendarPeriod'
import { projectPhotoCount } from '../projectPreview'
import type { Photo, Project } from '../types'
import { ProjectCardPreview } from './ProjectCardPreview'

type Props = {
  projects: Project[]
  photos: Photo[]
  onCreate: () => void
  onOpen: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

function formatUpdated(at: number) {
  return new Date(at).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function ProjectHome({ projects, photos, onCreate, onOpen, onRename, onDelete }: Props) {
  return (
    <div className="shelf-home">
      <header className="shelf-sign">
        <p className="shelf-sign-en">since this room</p>
        <h1>カレンダー工房</h1>
        <p className="shelf-sign-tag">誰かに思い出のカレンダーを贈りませんか？</p>
        <span className="shelf-sign-rule" />
      </header>

      {projects.length === 0 ? (
        <div className="shelf-empty">
          <button type="button" className="shelf-blank" onClick={onCreate}>
            <span className="shelf-blank-plus">＋</span>
            <strong>最初の一冊を置く</strong>
            <small>ここがあなたの書架になります</small>
          </button>
        </div>
      ) : (
        <section className="shelf-room">
          <div className="shelf-room-meta">
            <p>{projects.length}冊</p>
            <button type="button" className="shelf-new" onClick={onCreate}>
              新しいカレンダー
            </button>
          </div>

          <ul className="shelf-row">
            {projects.map((item, index) => {
              const period =
                item.periodLabel.trim() ||
                formatPeriodLabel(item.year, item.periodStartMonth ?? 1)
              const count = projectPhotoCount(item)
              const tilt = ((index % 5) - 2) * 1.4
              return (
                <li key={item.id} className="shelf-item" style={{ '--tilt': `${tilt}deg` } as CSSProperties}>
                  <button type="button" className="shelf-book" onClick={() => onOpen(item.id)}>
                    <ProjectCardPreview project={item} photos={photos} />
                    <span className="shelf-tag">
                      <strong>{item.name}</strong>
                      <em>{item.title}</em>
                      <small>
                        {period}
                        {count > 0 ? ` · 写真${count}` : ''}
                      </small>
                      <small>更新 {formatUpdated(item.updatedAt)}</small>
                    </span>
                  </button>
                  <div className="shelf-tools">
                    <button
                      type="button"
                      onClick={() => {
                        const next = window.prompt('カレンダーの名前', item.name)
                        if (next?.trim()) onRename(item.id, next.trim())
                      }}
                    >
                      名前
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        if (window.confirm(`「${item.name}」を削除しますか？`)) onDelete(item.id)
                      }}
                    >
                      削除
                    </button>
                  </div>
                </li>
              )
            })}
            <li className="shelf-item shelf-item-blank">
              <button type="button" className="shelf-blank shelf-blank-slot" onClick={onCreate}>
                <span className="shelf-blank-plus">＋</span>
                <strong>もう一冊</strong>
              </button>
            </li>
          </ul>
          <div className="shelf-plank" aria-hidden="true" />
        </section>
      )}
    </div>
  )
}
