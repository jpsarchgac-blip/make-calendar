import { fileToCompressedDataUrl } from './images'
import { defaultPhotoTransform } from './photoTransform'
import { emptyCoverSlots } from './coverPhotos'
import type { MonthDesign, Photo, Project } from './types'

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif|jfif|tiff?)$/i

export function isImageFile(file: File) {
  if (file.size <= 0) return false
  if (file.type.startsWith('image/')) return true
  return IMAGE_EXT.test(file.name)
}

export function imageFilesFromList(files: FileList | File[]): File[] {
  return [...files]
    .filter(isImageFile)
    .sort((a, b) => {
      const pathA = relativePath(a)
      const pathB = relativePath(b)
      return pathA.localeCompare(pathB, undefined, { numeric: true, sensitivity: 'base' })
    })
}

function relativePath(file: File) {
  return (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
}

export async function filesToPhotos(
  files: File[],
  onProgress?: (done: number, total: number, name: string) => void,
): Promise<Photo[]> {
  const photos: Photo[] = []
  const errors: string[] = []
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i]
    onProgress?.(i + 1, files.length, file.name)
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      photos.push({ id: crypto.randomUUID(), dataUrl, name: file.name })
    } catch (error) {
      console.error(error)
      errors.push(file.name)
    }
  }
  if (photos.length === 0 && errors.length) {
    throw new Error(errors.slice(0, 3).join('、'))
  }
  return photos
}

function pickId(ids: string[], index: number): string | null {
  if (ids.length === 0) return null
  return ids[index % ids.length] ?? null
}

/** 1か月あたり 表面1 + 裏面3 = 4枚ずつ順に割り当て */
export function applyPhotosToProject(project: Project, photos: Photo[]): Project {
  const ids = photos.map((p) => p.id)
  const months: MonthDesign[] = project.months.map((month, monthIndex) => {
    const base = monthIndex * 4
    return {
      ...month,
      frontPhotoId: pickId(ids, base),
      photoIds: [
        pickId(ids, base + 1),
        pickId(ids, base + 2),
        pickId(ids, base + 3),
      ] as MonthDesign['photoIds'],
      backPhotoTransforms: month.backPhotoTransforms ?? [
        defaultPhotoTransform(),
        defaultPhotoTransform(),
        defaultPhotoTransform(),
      ],
    }
  })

  const coverSlots = emptyCoverSlots().map((slot, index) => ({
    ...slot,
    photoId: pickId(ids, index),
  }))

  return {
    ...project,
    coverBirdPhotoId: ids[0] ?? project.coverBirdPhotoId,
    coverBirdPhotoTransform: ids[0] ? defaultPhotoTransform() : project.coverBirdPhotoTransform,
    coverSlots,
    months,
  }
}

export function folderLabelFromFiles(files: File[]): string | null {
  const first = files[0]
  if (!first) return null
  const rel = relativePath(first)
  const parts = rel.split(/[/\\]/).filter(Boolean)
  return parts.length > 1 ? parts[0] : null
}

function withRelativePath(file: File, path: string) {
  try {
    Object.defineProperty(file, 'webkitRelativePath', { value: path, configurable: true })
  } catch {
    /* ignore */
  }
  return file
}

type DirHandle = {
  name: string
  entries: () => AsyncIterable<[string, { kind: string; getFile: () => Promise<File> }]>
}

async function filesFromDirectoryHandle(handle: DirHandle, prefix = '', rootName = handle.name): Promise<File[]> {
  const files: File[] = []
  for await (const [name, entry] of handle.entries()) {
    const next = prefix ? `${prefix}/${name}` : name
    if (entry.kind === 'file') {
      const file = await entry.getFile()
      files.push(withRelativePath(file, `${rootName}/${next}`))
    } else if (entry.kind === 'directory') {
      files.push(...(await filesFromDirectoryHandle(entry as unknown as DirHandle, next, rootName)))
    }
  }
  return files
}

export async function pickImageFolder(): Promise<File[] | null> {
  const picker = (
    window as Window & {
      showDirectoryPicker?: (options?: { mode?: string }) => Promise<DirHandle>
    }
  ).showDirectoryPicker
  if (typeof picker !== 'function') return null
  try {
    const dir = await picker({ mode: 'read' })
    return filesFromDirectoryHandle(dir)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return []
    throw error
  }
}

