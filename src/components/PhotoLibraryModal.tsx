import type { Photo } from '../types'

type Props = {
  title: string
  photos: Photo[]
  open: boolean
  onClose: () => void
  onPick: (photoId: string) => void
}

export function PhotoLibraryModal({ title, photos, open, onClose, onPick }: Props) {
  if (!open) return null
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {photos.length === 0 ? (
          <p>まだ写真がありません。先にアップロードしてください。</p>
        ) : (
          <div className="library-grid">
            {photos.map((photo) => (
              <button key={photo.id} type="button" onClick={() => onPick(photo.id)}>
                <img src={photo.dataUrl} alt={photo.name} />
              </button>
            ))}
          </div>
        )}
        <button type="button" className="ghost" onClick={onClose}>閉じる</button>
      </div>
    </div>
  )
}
