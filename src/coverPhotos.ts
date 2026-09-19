import { defaultPhotoTransform } from './photoTransform'
import type { CoverSlot, Photo, Project } from './types'

export function emptyCoverSlots(): CoverSlot[] {
  return Array.from({ length: 6 }, () => ({
    photoId: null,
    transform: defaultPhotoTransform(),
  }))
}

export function collectedMonthPhotos(project: Project, photos: Photo[]): Photo[] {
  return project.months
    .flatMap((month) => [month.frontPhotoId, ...month.photoIds])
    .map((id) => (id ? photos.find((photo) => photo.id === id) ?? null : null))
    .filter((photo): photo is Photo => Boolean(photo))
}

export function resolveCoverPhoto(project: Project, photos: Photo[], index: number): Photo | null {
  const slot = project.coverSlots[index]
  if (slot?.photoId) {
    return photos.find((photo) => photo.id === slot.photoId) ?? null
  }
  const collected = collectedMonthPhotos(project, photos)
  return collected.length ? collected[index % collected.length] : null
}

export function resolveCoverTransform(project: Project, index: number) {
  return project.coverSlots[index]?.transform ?? defaultPhotoTransform()
}
