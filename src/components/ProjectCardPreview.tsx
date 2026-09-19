import { formatPeriodLabel } from '../calendarPeriod'
import { resolveCoverPhoto } from '../coverPhotos'
import { projectHeroPhoto } from '../projectPreview'
import { MONTHS_JA, type Photo, type Project } from '../types'

type Props = {
  project: Project
  photos: Photo[]
}

export function ProjectCardPreview({ project, photos }: Props) {
  const hero = projectHeroPhoto(project, photos)
  const polaroids = Array.from({ length: 6 }, (_, index) => resolveCoverPhoto(project, photos, index))
  const period =
    project.periodLabel.trim() || formatPeriodLabel(project.year, project.periodStartMonth ?? 1)
  const start = MONTHS_JA[(project.periodStartMonth ?? 1) - 1]

  return (
    <div className="shelf-cover" aria-hidden="true">
      <div className="shelf-cover-paper">
        <p className="shelf-cover-kicker">Original Photo Calendar</p>
        <p className="shelf-cover-title">{project.title || 'ことりカレンダー'}</p>
        <p className="shelf-cover-year">{project.year}</p>
        <div className="shelf-cover-hero">
          {hero ? <img src={hero.dataUrl} alt="" /> : <span className="shelf-cover-empty-bird" />}
        </div>
        <div className="shelf-cover-polaroids">
          {polaroids.map((photo, index) => (
            <span key={index} className="shelf-polaroid">
              {photo ? <img src={photo.dataUrl} alt="" /> : <span />}
            </span>
          ))}
        </div>
        <p className="shelf-cover-period">{period}</p>
      </div>
      <span className="shelf-cover-ribbon">{start}〜</span>
    </div>
  )
}
