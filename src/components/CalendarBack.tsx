import { MONTHS_EN, MONTHS_JA, pageDimensions, type MonthDesign, type PageOrientation, type Photo } from '../types'
import { BudgiePeek } from './Birds'
import { FootprintDecor } from './FootprintDecor'
import { FramedPhoto } from './FramedPhoto'

type Props = {
  year: number
  monthIndex: number
  birdName: string
  orientation: PageOrientation
  design: MonthDesign
  photos: Photo[]
  onCropSlot?: (slot: 0 | 1 | 2) => void
}

export function CalendarBack({ year, monthIndex, birdName, orientation, design, photos, onCropSlot }: Props) {
  const { width, height } = pageDimensions(orientation)
  const slots = design.photoIds.map((id) => photos.find((photo) => photo.id === id) ?? null)

  return (
    <article className={`sheet sheet-back orient-${orientation}`} style={{ width, height }}>
      <div className="sheet-grain" />
      <FootprintDecor monthIndex={monthIndex} variant="back" />
      <div className={`photo-stage layout-${design.layout}`}>
        {slots.map((photo, index) => (
          <figure
            key={index}
            className={`photo-frame slot-${index + 1}${onCropSlot && photo ? ' croppable' : ''}`}
            onClick={(e) => {
              if (!onCropSlot || !photo) return
              e.stopPropagation()
              onCropSlot(index as 0 | 1 | 2)
            }}
          >
            {photo ? (
              <FramedPhoto src={photo.dataUrl} transform={design.backPhotoTransforms[index] ?? { scale: 1, x: 50, y: 50 }} />
            ) : (
              <div className="photo-empty">
                <BudgiePeek className="empty-bird" />
                <span>写真 {index + 1}</span>
              </div>
            )}
          </figure>
        ))}
      </div>
      <div className="back-badge">
        <span className="back-month">{MONTHS_JA[monthIndex]}</span>
        <span className="back-en">{MONTHS_EN[monthIndex]}</span>
        <span className="back-year">{year}</span>
      </div>
      <p className="back-caption">
        {design.caption || (birdName ? `${birdName}の${MONTHS_JA[monthIndex]}` : `${year} ${MONTHS_JA[monthIndex]}`)}
      </p>
    </article>
  )
}
