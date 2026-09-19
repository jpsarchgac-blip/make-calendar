import { createPortal } from 'react-dom'
import {
  assignPhotoRole,
  allRoleOptions,
  findPhotoRole,
  parseRoleKey,
  roleKey,
  roleLabel,
  type PhotoTarget,
} from '../photoRoles'
import type { Photo, Project } from '../types'

type Props = {
  open: boolean
  project: Project
  photos: Photo[]
  onClose: () => void
  onProjectChange: (project: Project) => void
  onCrop: (target: PhotoTarget) => void
}

export function PhotoLabelBoard({ open, project, photos, onClose, onProjectChange, onCrop }: Props) {
  if (!open) return null
  const options = allRoleOptions(project)

  return createPortal(
    <div className="photo-board" role="dialog" aria-modal="true" aria-label="写真の配置">
      <div className="photo-board-card">
        <header className="photo-board-head">
          <div>
            <p className="photo-board-kicker">Photo labels</p>
            <h2>写真のラベル</h2>
            <p className="hint">何月の表面・裏面か、表紙のどこかを付け替えできます。サムネイルをクリックすると枠に合わせてトリミングします。</p>
          </div>
          <button type="button" className="ghost" onClick={onClose}>閉じる</button>
        </header>
        <div className="photo-board-grid">
          {photos.map((photo) => {
            const role = findPhotoRole(project, photo.id)
            return (
              <article key={photo.id} className="photo-board-item">
                <button
                  type="button"
                  className="photo-board-thumb"
                  onClick={() => {
                    if (role.kind === 'unused') return
                    onCrop(role)
                  }}
                  title={role.kind === 'unused' ? '先に配置先を選んでください' : 'クリックでトリミング'}
                >
                  <img src={photo.dataUrl} alt={photo.name} />
                  <span className="photo-board-badge">{roleLabel(project, role)}</span>
                </button>
                <select
                  value={roleKey(role)}
                  onChange={(e) =>
                    onProjectChange(assignPhotoRole(project, photo.id, parseRoleKey(e.target.value)))
                  }
                >
                  {options.map((item) => (
                    <option key={roleKey(item)} value={roleKey(item)}>
                      {roleLabel(project, item)}
                    </option>
                  ))}
                </select>
                <p className="photo-board-name">{photo.name}</p>
              </article>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}
