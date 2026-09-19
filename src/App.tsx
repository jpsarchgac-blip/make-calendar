import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { CalendarBack } from './components/CalendarBack'
import { CalendarFront } from './components/CalendarFront'
import { CoverPage } from './components/CoverPage'
import { CropModal } from './components/CropModal'
import { PhotoLibraryModal } from './components/PhotoLibraryModal'
import { PhotoLabelBoard } from './components/PhotoLabelBoard'
import { PreviewLightbox } from './components/PreviewLightbox'
import { ProjectHome } from './components/ProjectHome'
import { Sidebar } from './components/Sidebar'
import {
  applyPhotosToProject,
  filesToPhotos,
  folderLabelFromFiles,
  imageFilesFromList,
} from './folderImport'
import { fileToCompressedDataUrl } from './images'
import { warmupFootprintTints, FOOTPRINT_TINT_COLORS } from './footprintTint'
import { getJapaneseHolidays } from './holidays'
import { loadKinenbi, type KinenbiMap } from './kinenbi'
import { blankPageDataUrl, buildPdf, captureSheet, waitForExportSheet } from './pdf'
import { calendarMonthForSlot, holidayYearsForPeriod, slotNavLabel } from './calendarPeriod'
import {
  deleteProjectRecord,
  loadAllProjects,
  loadPhotos,
  savePhoto,
  saveProjectRecord,
} from './storage'
import { projectPhotoIds, type PhotoTarget } from './photoRoles'
import type { PhotoTransform } from './photoTransform'
import {
  MONTHS_JA,
  ORIENTATION_LABEL,
  pageDimensions,
  type CalendarEvent,
  type MonthDesign,
  type Photo,
  type Project,
  createDefaultProject,
} from './types'
import './App.css'

type Side = 'front' | 'back' | 'cover'
type AppView = 'home' | 'edit'
type Prefill = { title: string; month: number; day: number; yearly: boolean; kind: CalendarEvent['kind']; color: string }

export default function App() {
  const [ready, setReady] = useState(false)
  const [view, setView] = useState<AppView>('home')
  const [projectCatalog, setProjectCatalog] = useState<Project[]>([])
  const [project, setProject] = useState<Project | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [monthIndex, setMonthIndex] = useState(0)
  const [side, setSide] = useState<Side>('front')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [prefill, setPrefill] = useState<Prefill | null>(null)
  const [exportView, setExportView] = useState<{ side: Side; monthIndex: number } | null>(null)
  const [kinenbi, setKinenbi] = useState<KinenbiMap | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [labelBoardOpen, setLabelBoardOpen] = useState(false)
  const [importedPhotoIds, setImportedPhotoIds] = useState<string[]>([])
  const [cropTarget, setCropTarget] = useState<PhotoTarget | null>(null)
  const [coverPhotoPick, setCoverPhotoPick] = useState<PhotoTarget | null>(null)
  const [previewScale, setPreviewScale] = useState(0.5)
  const exportRef = useRef<HTMLDivElement>(null)
  const deskRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      loadAllProjects(),
      loadPhotos(),
      loadKinenbi(),
      warmupFootprintTints([...FOOTPRINT_TINT_COLORS]),
    ]).then(([projects, loadedPhotos, loadedKinenbi]) => {
      if (cancelled) return
      setProjectCatalog(projects)
      setPhotos(loadedPhotos)
      setKinenbi(loadedKinenbi)
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!project || !ready || view !== 'edit') return
    const timer = window.setTimeout(() => {
      saveProjectRecord(project)
        .then((saved) => {
          setProjectCatalog((list) => {
            const rest = list.filter((item) => item.id !== saved.id)
            return [saved, ...rest].sort((a, b) => b.updatedAt - a.updatedAt)
          })
        })
        .catch(() => undefined)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [project, ready, view])

  const holidays = useMemo(() => {
    if (!project?.showHolidays) return new Map<string, string>()
    const map = new Map<string, string>()
    const startMonth = project.periodStartMonth ?? 1
    for (const y of holidayYearsForPeriod(project.year, startMonth)) {
      for (const [key, label] of getJapaneseHolidays(y)) map.set(key, label)
    }
    return map
  }, [project?.showHolidays, project?.year, project?.periodStartMonth])

  const previewPageSize = useMemo(
    () => pageDimensions(project?.orientation ?? 'portrait'),
    [project?.orientation],
  )

  useEffect(() => {
    if (!project) return
    const ps = pageDimensions(project.orientation)
    const measure = () => {
      const desk = deskRef.current
      if (!desk) return
      const availW = desk.clientWidth - 40
      const availH = desk.clientHeight - 72
      if (availW <= 0 || availH <= 0) return
      const s = Math.min(availW / ps.width, availH / ps.height)
      setPreviewScale(Math.max(0.12, s))
    }
    measure()
    const ro = new ResizeObserver(measure)
    const el = deskRef.current
    if (el) ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [project, project?.orientation, side, monthIndex])

  if (!ready || !kinenbi) {
    return <div className="boot">カレンダー工房を準備しています…</div>
  }

  function openProject(id: string) {
    const picked = projectCatalog.find((item) => item.id === id)
    if (!picked) return
    setProject(picked)
    setMonthIndex(0)
    setSide('front')
    setView('edit')
  }

  async function createProject() {
    const fresh = createDefaultProject()
    await saveProjectRecord(fresh)
    setProjectCatalog((list) => [fresh, ...list])
    setProject(fresh)
    setMonthIndex(0)
    setSide('front')
    setView('edit')
  }

  async function renameProject(id: string, name: string) {
    const target = projectCatalog.find((item) => item.id === id)
    if (!target) return
    const saved = await saveProjectRecord({ ...target, name })
    setProjectCatalog((list) => list.map((item) => (item.id === id ? saved : item)))
    if (project?.id === id) setProject(saved)
  }

  async function removeProject(id: string) {
    await deleteProjectRecord(id)
    setProjectCatalog((list) => list.filter((item) => item.id !== id))
    if (project?.id === id) {
      setProject(null)
      setView('home')
    }
  }

  function backToHome() {
    setView('home')
    setProject(null)
    setPreviewOpen(false)
  }

  if (view === 'home') {
    return (
      <div className="app app-home">
        <ProjectHome
          projects={projectCatalog}
          photos={photos}
          onCreate={() => {
            createProject().catch(() => window.alert('カレンダーを作成できませんでした。'))
          }}
          onOpen={openProject}
          onRename={(id, name) => {
            renameProject(id, name).catch(() => undefined)
          }}
          onDelete={(id) => {
            removeProject(id).catch(() => window.alert('削除に失敗しました。'))
          }}
        />
      </div>
    )
  }

  if (!project) {
    return <div className="boot">カレンダーを開けませんでした。</div>
  }

  const activeProject = project
  const activeKinenbi = kinenbi
  const month = activeProject.months[monthIndex]
  const startMonth = activeProject.periodStartMonth ?? 1

  function calendarAtSlot(slot: number) {
    return calendarMonthForSlot(activeProject.year, startMonth, slot)
  }

  function patchProject(patch: Partial<Project>) {
    setProject((current) => (current ? { ...current, ...patch } : current))
  }

  function patchMonth(index: number, patch: Partial<MonthDesign>) {
    setProject((current) => {
      if (!current) return current
      const months = current.months.map((item, i) => (i === index ? { ...item, ...patch } : item))
      return { ...current, months }
    })
  }

  async function importPhotoFolder(fileList: FileList | File[]) {
    const imageFiles = imageFilesFromList(fileList)
    if (imageFiles.length === 0) {
      window.alert('フォルダ内に画像が見つかりませんでした。JPEG / PNG / WebP などを入れてください。')
      return
    }
    setBusy(true)
    setProgress('写真を読み込んでいます…')
    try {
      const imported = await filesToPhotos(imageFiles, (done, total) => {
        setProgress(`写真を読み込み中 (${done}/${total})`)
      })
      for (const photo of imported) await savePhoto(photo)
      setPhotos((current) => [...current, ...imported])
      const folderName = folderLabelFromFiles(imageFiles)
      setProject((current) => {
        if (!current) return current
        let next = applyPhotosToProject(current, imported)
        if (folderName && (next.name === '新しいカレンダー' || !next.name.trim())) {
          next = { ...next, name: folderName }
        }
        return next
      })
      setSide((current) => (activeProject.includeCover ? 'cover' : current === 'cover' ? 'front' : current))
      setImportedPhotoIds(imported.map((photo) => photo.id))
      setLabelBoardOpen(true)
    } catch (error) {
      console.error(error)
      window.alert('フォルダの取り込みに失敗しました。別のフォルダで試してください。')
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  async function uploadToSlot(slot: 0 | 1 | 2, files: FileList | File[]) {
    const file = files[0]
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      const photo: Photo = { id: crypto.randomUUID(), dataUrl, name: file.name }
      await savePhoto(photo)
      setPhotos((current) => [...current, photo])
      setProject((current) => {
        if (!current) return current
        return {
          ...current,
          months: current.months.map((item, index) => {
            if (index !== monthIndex) return item
            const nextIds = [...item.photoIds] as MonthDesign['photoIds']
            nextIds[slot] = photo.id
            return { ...item, photoIds: nextIds }
          }),
        }
      })
    } catch (error) {
      console.error(error)
      window.alert('写真を読み込めませんでした。別の画像で試してください。')
    }
  }

  function assignPhoto(slot: 0 | 1 | 2, photoId: string | null) {
    const nextIds = [...month.photoIds] as MonthDesign['photoIds']
    nextIds[slot] = photoId
    patchMonth(monthIndex, { photoIds: nextIds })
  }

  async function uploadFrontPhoto(files: FileList | File[]) {
    const file = files[0]
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      const photo: Photo = { id: crypto.randomUUID(), dataUrl, name: file.name }
      await savePhoto(photo)
      setPhotos((current) => [...current, photo])
      patchMonth(monthIndex, { frontPhotoId: photo.id })
    } catch (error) {
      console.error(error)
      window.alert('表面用の写真を読み込めませんでした。')
    }
  }

  function assignFrontPhoto(photoId: string | null) {
    patchMonth(monthIndex, { frontPhotoId: photoId })
  }

  async function uploadCoverSlot(slot: number, files: FileList | File[]) {
    const file = files[0]
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      const photo: Photo = { id: crypto.randomUUID(), dataUrl, name: file.name }
      await savePhoto(photo)
      setPhotos((current) => [...current, photo])
      setProject((current) => {
        if (!current) return current
        const coverSlots = current.coverSlots.map((item, index) =>
          index === slot ? { ...item, photoId: photo.id } : item,
        )
        return { ...current, coverSlots }
      })
    } catch (error) {
      console.error(error)
      window.alert('表紙用の写真を読み込めませんでした。')
    }
  }

  function assignCoverSlot(slot: number, photoId: string | null) {
    setProject((current) => {
      if (!current) return current
      const coverSlots = current.coverSlots.map((item, index) =>
        index === slot ? { ...item, photoId } : item,
      )
      return { ...current, coverSlots }
    })
  }

  function patchCoverTransform(slot: number, transform: PhotoTransform) {
    setProject((current) => {
      if (!current) return current
      const coverSlots = current.coverSlots.map((item, index) =>
        index === slot ? { ...item, transform } : item,
      )
      return { ...current, coverSlots }
    })
  }

  async function uploadCoverBirdPhoto(files: FileList | File[]) {
    const file = files[0]
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      const photo: Photo = { id: crypto.randomUUID(), dataUrl, name: file.name }
      await savePhoto(photo)
      setPhotos((current) => [...current, photo])
      patchProject({ coverBirdPhotoId: photo.id })
    } catch (error) {
      console.error(error)
      window.alert('表紙のメイン写真を読み込めませんでした。')
    }
  }

  function assignCoverBirdPhoto(photoId: string | null) {
    patchProject({ coverBirdPhotoId: photoId })
  }

  function patchCoverBirdTransform(transform: PhotoTransform) {
    patchProject({ coverBirdPhotoTransform: transform })
  }

  function addEvent(event: Omit<CalendarEvent, 'id'>) {
    setProject((current) =>
      current ? { ...current, events: [...current.events, { ...event, id: crypto.randomUUID() }] } : current,
    )
  }

  async function exportPdf() {
    if (busy) return
    setBusy(true)
    try {
      await document.fonts.ready
      const images: string[] = []
      type ExportPage =
        | { kind: 'blank'; label: string }
        | { kind: 'sheet'; side: Side; monthIndex: number; label: string }
      const pages: ExportPage[] = []
      if (activeProject.includeCover) {
        pages.push({ kind: 'sheet', side: 'cover', monthIndex: 0, label: '表紙' })
        pages.push({ kind: 'blank', label: '表紙の裏（白紙）' })
      }
      for (let i = 0; i < 12; i += 1) {
        const monthLabel = MONTHS_JA[calendarMonthForSlot(activeProject.year, startMonth, i).monthIndex]
        pages.push({ kind: 'sheet', side: 'front', monthIndex: i, label: `${monthLabel}の表面` })
        pages.push({ kind: 'sheet', side: 'back', monthIndex: i, label: `${monthLabel}の裏面` })
      }

      for (let i = 0; i < pages.length; i += 1) {
        const page = pages[i]
        setProgress(`${page.label}を書き出しています（${i + 1}/${pages.length}）`)
        if (page.kind === 'blank') {
          images.push(blankPageDataUrl(activeProject.orientation))
          continue
        }
        flushSync(() => setExportView({ side: page.side, monthIndex: page.monthIndex }))
        const sheet = await waitForExportSheet(exportRef.current)
        const flipBack = page.side === 'back' && activeProject.flipBackForDuplex
        images.push(await captureSheet(sheet, activeProject.orientation, flipBack))
      }

      const name = `${activeProject.birdName || activeProject.title || 'ことり'}カレンダー${activeProject.year}.pdf`
      await buildPdf(images, name, activeProject.orientation)
    } catch (error) {
      console.error(error)
      window.alert('PDFの書き出しに失敗しました。写真の枚数を減らすか、もう一度試してください。')
    } finally {
      setExportView(null)
      setBusy(false)
      setProgress('')
    }
  }

  const pageSize = previewPageSize

  function coverPickTitle(target: PhotoTarget) {
    if (target.kind === 'coverBird') return '表紙メイン写真'
    if (target.kind === 'cover') return `表紙の写真 ${target.slot + 1}`
    return '写真を選ぶ'
  }

  function applyCoverPhotoPick(photoId: string) {
    if (!coverPhotoPick) return
    if (coverPhotoPick.kind === 'coverBird') assignCoverBirdPhoto(photoId)
    else if (coverPhotoPick.kind === 'cover') assignCoverSlot(coverPhotoPick.slot, photoId)
    setCoverPhotoPick(null)
  }

  function openCrop(target: PhotoTarget) {
    setCropTarget(target)
    setPreviewOpen(false)
    if (target.kind === 'coverBird' || target.kind === 'cover') setSide('cover')
    if (target.kind === 'front') {
      setMonthIndex(target.monthIndex)
      setSide('front')
    }
    if (target.kind === 'back') {
      setMonthIndex(target.monthIndex)
      setSide('back')
    }
  }

  function renderPageSheet(page: { side: Side; monthIndex: number }, forExport: boolean) {
    const crop = forExport ? undefined : openCrop
    const pageMonth = activeProject.months[page.monthIndex]
    const cal = calendarAtSlot(page.monthIndex)

    if (page.side === 'cover') {
      return (
        <CoverPage
          project={activeProject}
          photos={photos}
          onPickPhoto={forExport ? undefined : (target) => setCoverPhotoPick(target)}
          onCrop={crop}
        />
      )
    }
    if (page.side === 'front') {
      return (
        <CalendarFront
          year={cal.year}
          monthIndex={cal.monthIndex}
          title={activeProject.title}
          pageTitle={pageMonth.pageTitle}
          birdName={activeProject.birdName}
          orientation={activeProject.orientation}
          holidays={holidays}
          kinenbi={activeKinenbi}
          showKinenbi={activeProject.showKinenbi}
          showSeasonalFood={activeProject.showSeasonalFood}
          events={activeProject.events}
          photos={photos}
          frontPhotoId={pageMonth.frontPhotoId}
          frontPhotoTransform={pageMonth.frontPhotoTransform}
          memo={pageMonth.memo}
          onDateClick={
            forExport
              ? undefined
              : (clickedMonth, day) => {
                  setPrefill({
                    title: '__date__',
                    month: clickedMonth,
                    day,
                    yearly: true,
                    kind: 'birthday',
                    color: '#c45c4a',
                  })
                }
          }
          onCropFront={crop ? () => crop({ kind: 'front', monthIndex: page.monthIndex }) : undefined}
        />
      )
    }
    return (
      <CalendarBack
        year={cal.year}
        monthIndex={cal.monthIndex}
        birdName={activeProject.birdName}
        orientation={activeProject.orientation}
        design={pageMonth}
        photos={photos}
        onCropSlot={crop ? (slot) => crop({ kind: 'back', monthIndex: page.monthIndex, slot }) : undefined}
      />
    )
  }

  function renderSheet(forExport = false) {
    return renderPageSheet({ side, monthIndex }, forExport)
  }

  return (
    <div className="app">
      <Sidebar
        project={activeProject}
        photos={photos}
        monthIndex={monthIndex}
        busy={busy}
        onBackToList={backToHome}
        onProjectChange={patchProject}
        onMonthChange={patchMonth}
        onAddEvent={addEvent}
        onUpdateEvent={(event) =>
          setProject((current) =>
            current ? { ...current, events: current.events.map((item) => (item.id === event.id ? event : item)) } : current,
          )
        }
        onRemoveEvent={(id) =>
          setProject((current) =>
            current ? { ...current, events: current.events.filter((event) => event.id !== id) } : current,
          )
        }
        onUploadToSlot={uploadToSlot}
        onAssignPhoto={assignPhoto}
        onUploadFrontPhoto={uploadFrontPhoto}
        onAssignFrontPhoto={assignFrontPhoto}
        onUploadCoverSlot={uploadCoverSlot}
        onAssignCoverSlot={assignCoverSlot}
        onCoverTransformChange={patchCoverTransform}
        onUploadCoverBirdPhoto={uploadCoverBirdPhoto}
        onAssignCoverBirdPhoto={assignCoverBirdPhoto}
        onCoverBirdTransformChange={patchCoverBirdTransform}
        kinenbiCount={kinenbi.size}
        onExport={exportPdf}
        onImportPhotoFolder={importPhotoFolder}
        onOpenPhotoBoard={() => setLabelBoardOpen(true)}
        onPrefillEvent={prefill}
        onClearPrefill={() => setPrefill(null)}
      />

      <main className="workspace">
        <div className="workspace-bar">
          <div className="month-nav">
            {Array.from({ length: 12 }, (_, index) => (
              <button
                key={index}
                type="button"
                className={index === monthIndex ? 'picked' : undefined}
                onClick={() => {
                  setMonthIndex(index)
                  if (side === 'cover') setSide('front')
                }}
              >
                {slotNavLabel(activeProject.year, startMonth, index)}
              </button>
            ))}
          </div>
          <div className="orient-toggle">
            <button
              type="button"
              className={activeProject.orientation === 'portrait' ? 'picked' : undefined}
              onClick={() => patchProject({ orientation: 'portrait' })}
            >
              たて
            </button>
            <button
              type="button"
              className={activeProject.orientation === 'landscape' ? 'picked' : undefined}
              onClick={() => patchProject({ orientation: 'landscape' })}
            >
              よこ
            </button>
          </div>
          <div className="side-toggle">
            {activeProject.includeCover ? (
              <button type="button" className={side === 'cover' ? 'picked' : undefined} onClick={() => setSide('cover')}>
                表紙
              </button>
            ) : null}
            <button type="button" className={side === 'front' ? 'picked' : undefined} onClick={() => setSide('front')}>
              表面
            </button>
            <button type="button" className={side === 'back' ? 'picked' : undefined} onClick={() => setSide('back')}>
              裏面
            </button>
          </div>
          <button type="button" className="ghost preview-zoom-btn" onClick={() => setPreviewOpen(true)}>
            拡大表示
          </button>
        </div>

        <div ref={deskRef} className={`desk desk-${activeProject.orientation}`}>
          <div
            className={`preview-frame preview-expandable preview-${activeProject.orientation}`}
            style={{ width: pageSize.width * previewScale, height: pageSize.height * previewScale }}
            onClick={() => setPreviewOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setPreviewOpen(true)
              }
            }}
            role="button"
            tabIndex={0}
            title="クリックで拡大表示"
          >
            <div
              key={`${activeProject.orientation}-${side}-${monthIndex}`}
              className="preview-scale"
              style={{
                width: pageSize.width,
                height: pageSize.height,
                transform: `scale(${previewScale})`,
              }}
            >
              {renderSheet()}
            </div>
          </div>
          <p className="desk-note">
            {ORIENTATION_LABEL[activeProject.orientation]} / 1か月1枚＋裏面の写真ページ · プレビューをクリックで拡大
          </p>
        </div>
      </main>

      <div className="export-root" ref={exportRef} aria-hidden="true">
        {exportView ? renderPageSheet(exportView, true) : null}
      </div>

      <PreviewLightbox
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        pageWidth={pageSize.width}
        pageHeight={pageSize.height}
      >
        <div key={`lb-${side}-${monthIndex}-${activeProject.orientation}`} className="lightbox-sheet-root">
          {renderSheet(false)}
        </div>
      </PreviewLightbox>

      <PhotoLabelBoard
        open={labelBoardOpen}
        project={activeProject}
        photos={photos.filter(
          (photo) =>
            importedPhotoIds.includes(photo.id) || projectPhotoIds(activeProject).includes(photo.id),
        )}
        onClose={() => setLabelBoardOpen(false)}
        onProjectChange={(next) => setProject(next)}
        onCrop={(target) => {
          setLabelBoardOpen(false)
          openCrop(target)
        }}
      />
      <CropModal
        target={cropTarget}
        project={activeProject}
        photos={photos}
        onClose={() => setCropTarget(null)}
        onProjectChange={(next) => setProject(next)}
      />
      <PhotoLibraryModal
        open={coverPhotoPick !== null}
        title={coverPhotoPick ? coverPickTitle(coverPhotoPick) : ''}
        photos={photos}
        onClose={() => setCoverPhotoPick(null)}
        onPick={applyCoverPhotoPick}
      />

      {busy ? (
        <div className="progress-mask">
          <div className="progress-card">
            <p>PDFを綴じています</p>
            <strong>{progress}</strong>
          </div>
        </div>
      ) : null}
    </div>
  )
}
