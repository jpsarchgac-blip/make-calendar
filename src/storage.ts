import { defaultPhotoTransform } from './photoTransform'
import { emptyCoverSlots } from './coverPhotos'
import { defaultPeriodLabel } from './calendarPeriod'
import { createDefaultProject, type MonthDesign, type Photo, type Project } from './types'

const DB_NAME = 'kotori-calendar'
const DB_VERSION = 2

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta')
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos')
      if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function reqAs<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function normalizeStoredProject(stored: Partial<Project> & Record<string, unknown>): Project {
  const year = typeof stored.year === 'number' ? stored.year : 2027
  const periodStartMonth =
    typeof stored.periodStartMonth === 'number' ? stored.periodStartMonth : 1
  const base = createDefaultProject(year, typeof stored.name === 'string' ? stored.name : 'カレンダー')
  const months =
    stored.months?.length === 12
      ? stored.months.map((month, index) => ({
          ...base.months[index],
          ...month,
          pageTitle: month.pageTitle ?? '',
          frontPhotoId: month.frontPhotoId ?? null,
          frontPhotoTransform: month.frontPhotoTransform ?? defaultPhotoTransform(),
          memo: month.memo ?? '',
          photoIds:
            month.photoIds?.length === 3
              ? month.photoIds
              : ([null, null, null] as MonthDesign['photoIds']),
          backPhotoTransforms:
            month.backPhotoTransforms?.length === 3
              ? month.backPhotoTransforms.map((item) => item ?? defaultPhotoTransform()) as MonthDesign['backPhotoTransforms']
              : ([defaultPhotoTransform(), defaultPhotoTransform(), defaultPhotoTransform()] as MonthDesign['backPhotoTransforms']),
        }))
      : base.months

  const title = typeof stored.title === 'string' ? stored.title : base.title
  const name =
    typeof stored.name === 'string' && stored.name.trim()
      ? stored.name
      : title || base.name

  return {
    ...base,
    ...stored,
    id: typeof stored.id === 'string' ? stored.id : crypto.randomUUID(),
    name,
    updatedAt: typeof stored.updatedAt === 'number' ? stored.updatedAt : Date.now(),
    title,
    periodStartMonth,
    periodLabel:
      typeof stored.periodLabel === 'string' && stored.periodLabel.trim()
        ? stored.periodLabel
        : defaultPeriodLabel(year, periodStartMonth),
    coverBirdPhotoId: stored.coverBirdPhotoId ?? null,
    coverBirdPhotoTransform: stored.coverBirdPhotoTransform ?? defaultPhotoTransform(),
    showKinenbi: stored.showKinenbi ?? true,
    showSeasonalFood: stored.showSeasonalFood ?? true,
    flipBackForDuplex: stored.flipBackForDuplex ?? true,
    orientation: stored.orientation === 'landscape' ? 'landscape' : 'portrait',
    coverSlots:
      stored.coverSlots?.length === 6
        ? stored.coverSlots.map((slot) => ({
            photoId: slot.photoId ?? null,
            transform: slot.transform ?? defaultPhotoTransform(),
          }))
        : emptyCoverSlots(),
    months,
  }
}

async function migrateLegacyProject(db: IDBDatabase) {
  const tx = db.transaction(['projects', 'meta'], 'readwrite')
  const projects = tx.objectStore('projects')
  const count = await reqAs<number>(projects.count())
  if (count > 0) {
    await txDone(tx)
    return
  }
  const legacy = await reqAs<Project | undefined>(tx.objectStore('meta').get('project'))
  if (legacy) {
    const normalized = normalizeStoredProject(legacy as Partial<Project>)
    projects.put(normalized, normalized.id)
  } else {
    const fresh = createDefaultProject()
    projects.put(fresh, fresh.id)
  }
  await txDone(tx)
}

export async function loadAllProjects(): Promise<Project[]> {
  try {
    const db = await openDb()
    await migrateLegacyProject(db)
    const tx = db.transaction('projects', 'readonly')
    const raw = await reqAs<Project[]>(tx.objectStore('projects').getAll())
    db.close()
    return raw
      .map((item) => normalizeStoredProject(item))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return [createDefaultProject()]
  }
}

export async function saveProjectRecord(project: Project) {
  const toSave: Project = { ...project, updatedAt: Date.now() }
  const db = await openDb()
  const tx = db.transaction('projects', 'readwrite')
  tx.objectStore('projects').put(toSave, toSave.id)
  await txDone(tx)
  db.close()
  return toSave
}

export async function deleteProjectRecord(id: string) {
  const db = await openDb()
  const tx = db.transaction('projects', 'readwrite')
  tx.objectStore('projects').delete(id)
  await txDone(tx)
  db.close()
}

/** @deprecated 互換用 */
export async function loadProject(): Promise<Project> {
  const all = await loadAllProjects()
  return all[0] ?? createDefaultProject()
}

/** @deprecated 互換用 */
export async function saveProject(project: Project) {
  await saveProjectRecord(project)
}

export async function loadPhotos(): Promise<Photo[]> {
  try {
    const db = await openDb()
    const tx = db.transaction('photos', 'readonly')
    const photos = await reqAs<Photo[]>(tx.objectStore('photos').getAll())
    db.close()
    return photos ?? []
  } catch {
    return []
  }
}

export async function savePhoto(photo: Photo) {
  const db = await openDb()
  const tx = db.transaction('photos', 'readwrite')
  tx.objectStore('photos').put(photo, photo.id)
  await txDone(tx)
  db.close()
}

export async function deletePhoto(id: string) {
  const db = await openDb()
  const tx = db.transaction('photos', 'readwrite')
  tx.objectStore('photos').delete(id)
  await txDone(tx)
  db.close()
}

function txDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}
