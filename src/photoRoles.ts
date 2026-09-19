import { calendarMonthForSlot, slotNavLabel } from './calendarPeriod'
import { defaultPhotoTransform, type PhotoTransform } from './photoTransform'
import { MONTHS_JA, type Project } from './types'

export type PhotoTarget =
  | { kind: 'coverBird' }
  | { kind: 'cover'; slot: number }
  | { kind: 'front'; monthIndex: number }
  | { kind: 'back'; monthIndex: number; slot: 0 | 1 | 2 }

export type PhotoRole = { kind: 'unused' } | PhotoTarget

export function roleKey(role: PhotoRole) {
  if (role.kind === 'unused') return 'unused'
  if (role.kind === 'coverBird') return 'coverBird'
  if (role.kind === 'cover') return `cover:${role.slot}`
  if (role.kind === 'front') return `front:${role.monthIndex}`
  return `back:${role.monthIndex}:${role.slot}`
}

export function parseRoleKey(key: string): PhotoRole {
  if (key === 'unused') return { kind: 'unused' }
  if (key === 'coverBird') return { kind: 'coverBird' }
  if (key.startsWith('cover:')) return { kind: 'cover', slot: Number(key.slice(6)) || 0 }
  if (key.startsWith('front:')) return { kind: 'front', monthIndex: Number(key.slice(6)) || 0 }
  const parts = key.split(':')
  const monthIndex = Number(parts[1]) || 0
  const slot = (Number(parts[2]) || 0) as 0 | 1 | 2
  return { kind: 'back', monthIndex, slot }
}

export function roleLabel(project: Project, role: PhotoRole) {
  const start = project.periodStartMonth ?? 1
  if (role.kind === 'unused') return '未配置'
  if (role.kind === 'coverBird') return '表紙メイン'
  if (role.kind === 'cover') return `表紙ポラロイド ${role.slot + 1}`
  const nav = slotNavLabel(project.year, start, role.monthIndex)
  const cal = calendarMonthForSlot(project.year, start, role.monthIndex)
  const month = `${cal.year}年${MONTHS_JA[cal.monthIndex]}`
  if (role.kind === 'front') return `${nav} 表面（${month}）`
  return `${nav} 裏面${role.slot + 1}（${month}）`
}

export function allRoleOptions(_project: Project): PhotoRole[] {
  const months: PhotoRole[] = Array.from({ length: 12 }, (_, monthIndex) => [
    { kind: 'front' as const, monthIndex },
    { kind: 'back' as const, monthIndex, slot: 0 as const },
    { kind: 'back' as const, monthIndex, slot: 1 as const },
    { kind: 'back' as const, monthIndex, slot: 2 as const },
  ]).flat()
  return [
    { kind: 'unused' },
    { kind: 'coverBird' },
    ...Array.from({ length: 6 }, (_, slot) => ({ kind: 'cover' as const, slot })),
    ...months,
  ]
}

export function findPhotoRole(project: Project, photoId: string): PhotoRole {
  if (project.coverBirdPhotoId === photoId) return { kind: 'coverBird' }
  const coverSlot = project.coverSlots.findIndex((slot) => slot.photoId === photoId)
  if (coverSlot >= 0) return { kind: 'cover', slot: coverSlot }
  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const month = project.months[monthIndex]
    if (month.frontPhotoId === photoId) return { kind: 'front', monthIndex }
    const back = month.photoIds.findIndex((id) => id === photoId)
    if (back >= 0) return { kind: 'back', monthIndex, slot: back as 0 | 1 | 2 }
  }
  return { kind: 'unused' }
}

export function photoIdAt(project: Project, role: PhotoRole): string | null {
  if (role.kind === 'unused') return null
  if (role.kind === 'coverBird') return project.coverBirdPhotoId
  if (role.kind === 'cover') return project.coverSlots[role.slot]?.photoId ?? null
  const month = project.months[role.monthIndex]
  if (role.kind === 'front') return month?.frontPhotoId ?? null
  return month?.photoIds[role.slot] ?? null
}

function writePhotoId(project: Project, role: PhotoRole, photoId: string | null): Project {
  if (role.kind === 'unused') return project
  if (role.kind === 'coverBird') return { ...project, coverBirdPhotoId: photoId }
  if (role.kind === 'cover') {
    const coverSlots = project.coverSlots.map((slot, index) =>
      index === role.slot ? { ...slot, photoId } : slot,
    )
    return { ...project, coverSlots }
  }
  const months = project.months.map((month, index) => {
    if (index !== role.monthIndex) return month
    if (role.kind === 'front') return { ...month, frontPhotoId: photoId }
    const photoIds = [...month.photoIds] as typeof month.photoIds
    photoIds[role.slot] = photoId
    return { ...month, photoIds }
  })
  return { ...project, months }
}

function clearPhoto(project: Project, photoId: string): Project {
  return writePhotoId(project, findPhotoRole(project, photoId), null)
}

export function assignPhotoRole(project: Project, photoId: string, role: PhotoRole): Project {
  const from = findPhotoRole(project, photoId)
  if (roleKey(from) === roleKey(role)) return project
  const occupant = photoIdAt(project, role)
  let next = clearPhoto(project, photoId)
  next = writePhotoId(next, role, photoId)
  if (occupant && occupant !== photoId && from.kind !== 'unused') {
    next = writePhotoId(next, from, occupant)
  }
  return next
}

export function transformAt(project: Project, target: PhotoTarget): PhotoTransform {
  if (target.kind === 'coverBird') return project.coverBirdPhotoTransform
  if (target.kind === 'cover') {
    return project.coverSlots[target.slot]?.transform ?? defaultPhotoTransform()
  }
  const month = project.months[target.monthIndex]
  if (target.kind === 'front') return month.frontPhotoTransform
  return month.backPhotoTransforms?.[target.slot] ?? defaultPhotoTransform()
}

export function writeTransform(project: Project, target: PhotoTarget, transform: PhotoTransform): Project {
  if (target.kind === 'coverBird') return { ...project, coverBirdPhotoTransform: transform }
  if (target.kind === 'cover') {
    const coverSlots = project.coverSlots.map((slot, index) =>
      index === target.slot ? { ...slot, transform } : slot,
    )
    return { ...project, coverSlots }
  }
  const months = project.months.map((month, index) => {
    if (index !== target.monthIndex) return month
    if (target.kind === 'front') return { ...month, frontPhotoTransform: transform }
    const current = month.backPhotoTransforms ?? [
      defaultPhotoTransform(),
      defaultPhotoTransform(),
      defaultPhotoTransform(),
    ]
    const backPhotoTransforms = [...current] as typeof month.backPhotoTransforms
    backPhotoTransforms[target.slot] = transform
    return { ...month, backPhotoTransforms }
  })
  return { ...project, months }
}

export function cropPreviewClass(target: PhotoTarget) {
  if (target.kind === 'coverBird') return 'frame-preview-polaroid'
  if (target.kind === 'cover') return 'frame-preview-polaroid'
  if (target.kind === 'front') return 'frame-preview-wide'
  return 'frame-preview-polaroid'
}

export function projectPhotoIds(project: Project) {
  const ids: string[] = []
  const push = (id: string | null) => {
    if (id && !ids.includes(id)) ids.push(id)
  }
  push(project.coverBirdPhotoId)
  for (const slot of project.coverSlots) push(slot.photoId)
  for (const month of project.months) {
    push(month.frontPhotoId)
    for (const id of month.photoIds) push(id)
  }
  return ids
}
