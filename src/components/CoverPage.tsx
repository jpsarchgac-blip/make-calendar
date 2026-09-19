import { resolveCoverPhoto, resolveCoverTransform } from '../coverPhotos'
import { pageDimensions, type Photo, type Project } from '../types'
import type { PhotoTarget } from '../photoRoles'
import { BudgiePerched, LeafSprig } from './Birds'
import { FootprintDecor } from './FootprintDecor'
import { FramedPhoto } from './FramedPhoto'

type Props = {
  project: Project
  photos: Photo[]
  onPickPhoto?: (target: PhotoTarget) => void
  onCrop?: (target: PhotoTarget) => void
}

export function CoverPage({ project, photos, onPickPhoto, onCrop }: Props) {
  const { width, height } = pageDimensions(project.orientation)
  const coverBirdPhoto = photos.find((photo) => photo.id === project.coverBirdPhotoId)

  return (
    <article className={`sheet sheet-cover orient-${project.orientation}`} style={{ width, height }}>
      <div className="sheet-grain" />
      <FootprintDecor monthIndex={0} variant="cover" />
      <div className="cover-inner">
        <div className="cover-copy">
          <p className="cover-kicker">Original Photo Calendar</p>
          <h1 className="cover-title">{project.title}</h1>
          <p className="cover-year">{project.year}</p>
          <LeafSprig className="cover-sprig" />
          <div className="cover-hero">
            <div
              className={`cover-hero-media${onPickPhoto ? ' cover-pickable' : ''}`}
              title={onPickPhoto ? 'クリックで写真を変更' : undefined}
              onClick={(e) => {
                if (!onPickPhoto) return
                e.stopPropagation()
                onPickPhoto({ kind: 'coverBird' })
              }}
            >
              {coverBirdPhoto ? (
                <FramedPhoto
                  className="cover-bird-photo"
                  src={coverBirdPhoto.dataUrl}
                  transform={project.coverBirdPhotoTransform}
                />
              ) : (
                <BudgiePerched className="cover-bird" />
              )}
              {coverBirdPhoto && onCrop ? (
                <button
                  type="button"
                  className="sheet-crop-btn cover-slot-crop-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCrop({ kind: 'coverBird' })
                  }}
                >
                  トリミング
                </button>
              ) : null}
            </div>
          </div>
          {project.periodLabel.trim() ? <p className="cover-foot">{project.periodLabel}</p> : null}
        </div>
        <div className="cover-photos">
          {Array.from({ length: 6 }, (_, index) => {
            const photo = resolveCoverPhoto(project, photos, index)
            const transform = resolveCoverTransform(project, index)
            return (
              <figure
                key={index}
                className={`cover-polaroid${onPickPhoto ? ' cover-pickable' : ''}`}
                title={onPickPhoto ? 'クリックで写真を変更' : undefined}
                onClick={(e) => {
                  if (!onPickPhoto) return
                  e.stopPropagation()
                  onPickPhoto({ kind: 'cover', slot: index })
                }}
              >
                {photo ? (
                  <FramedPhoto src={photo.dataUrl} transform={transform} />
                ) : (
                  <span className="cover-empty">photo</span>
                )}
                {photo && onCrop ? (
                  <button
                    type="button"
                    className="sheet-crop-btn cover-slot-crop-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCrop({ kind: 'cover', slot: index })
                    }}
                  >
                    トリミング
                  </button>
                ) : null}
              </figure>
            )
          })}
        </div>
      </div>
    </article>
  )
}
