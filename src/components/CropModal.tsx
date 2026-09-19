import { createPortal } from 'react-dom'
import { cropPreviewClass, photoIdAt, roleLabel, transformAt, writeTransform, type PhotoTarget } from '../photoRoles'
import type { Photo, Project } from '../types'
import { PhotoFrameEditor } from './PhotoFrameEditor'

type Props = {
  target: PhotoTarget | null
  project: Project
  photos: Photo[]
  onClose: () => void
  onProjectChange: (project: Project) => void
}

export function CropModal({ target, project, photos, onClose, onProjectChange }: Props) {
  if (!target) return null
  const photoId = photoIdAt(project, target)
  const photo = photos.find((item) => item.id === photoId) ?? null
  const transform = transformAt(project, target)

  return createPortal(
    <div className="crop-modal" role="dialog" aria-modal="true" aria-label="トリミング">
      <div className="crop-modal-card">
        <header className="crop-modal-head">
          <div>
            <p className="photo-board-kicker">Fixed crop</p>
            <h2>{roleLabel(project, target)}</h2>
            <p className="hint">枠の形は固定です。ドラッグで位置、スライダーで拡大して切り取ります。</p>
          </div>
          <button type="button" className="ghost" onClick={onClose}>完了</button>
        </header>
        <PhotoFrameEditor
          label="見え方"
          photo={photo}
          transform={transform}
          previewClassName={`${cropPreviewClass(target)} crop-modal-preview`}
          onChange={(next) => onProjectChange(writeTransform(project, target, next))}
        />
      </div>
    </div>,
    document.body,
  )
}
