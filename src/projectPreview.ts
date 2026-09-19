import { resolveCoverPhoto } from './coverPhotos'
import type { Photo, Project } from './types'

export function projectHeroPhoto(project: Project, photos: Photo[]): Photo | null {
  if (project.coverBirdPhotoId) {
    return photos.find((p) => p.id === project.coverBirdPhotoId) ?? null
  }
  return resolveCoverPhoto(project, photos, 0)
}

export function projectThumbPhotos(project: Project, photos: Photo[], limit = 3): Photo[] {
  const seen = new Set<string>()
  const result: Photo[] = []
  const push = (photo: Photo | null | undefined) => {
    if (!photo || seen.has(photo.id)) return
    seen.add(photo.id)
    result.push(photo)
  }
  for (let i = 0; i < 6; i += 1) push(resolveCoverPhoto(project, photos, i))
  for (const month of project.months) {
    push(month.frontPhotoId ? photos.find((p) => p.id === month.frontPhotoId) : null)
    for (const id of month.photoIds) push(id ? photos.find((p) => p.id === id) : null)
  }
  return result.slice(0, limit)
}

export function projectPhotoCount(project: Project): number {
  const ids = new Set<string>()
  if (project.coverBirdPhotoId) ids.add(project.coverBirdPhotoId)
  for (const slot of project.coverSlots) if (slot.photoId) ids.add(slot.photoId)
  for (const month of project.months) {
    if (month.frontPhotoId) ids.add(month.frontPhotoId)
    for (const id of month.photoIds) if (id) ids.add(id)
  }
  return ids.size
}
