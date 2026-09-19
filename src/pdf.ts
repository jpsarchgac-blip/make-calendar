import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { pageDimensions, type PageOrientation } from './types'
import { prepareClonedSheetForCapture } from './exportBake'
import { waitForFonts, waitForImages } from './images'

const EXPORT_UI_SELECTOR = '.sheet-crop-btn, .cover-slot-crop-btn'

function captureScale() {
  return Math.min(3, Math.max(2, window.devicePixelRatio || 2))
}

export async function waitForExportSheet(root: HTMLElement | null): Promise<HTMLElement> {
  if (!root) throw new Error('ページを用意できませんでした')
  for (let attempt = 0; attempt < 48; attempt += 1) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const sheet = root.querySelector('.sheet')
    if (!(sheet instanceof HTMLElement)) continue
    await waitForFonts()
    await waitForImages(sheet)
    const { width, height } = sheet.getBoundingClientRect()
    if (width >= 8 && height >= 8) {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      await new Promise((resolve) => setTimeout(resolve, 60))
      return sheet
    }
  }
  throw new Error('ページを用意できませんでした')
}

const PAPER = '#fffdf8'

/** visibility:hidden や z-index 背面だと html2canvas が真っ白になる */
function mountExportRootForCapture(sheet: HTMLElement) {
  const root = sheet.closest('.export-root')
  if (!(root instanceof HTMLElement)) return () => {}
  const style = root.style
  const prev = {
    visibility: style.visibility,
    opacity: style.opacity,
    left: style.left,
    top: style.top,
    zIndex: style.zIndex,
  }
  style.visibility = 'visible'
  style.opacity = '1'
  style.left = '-12000px'
  style.top = '0'
  style.zIndex = '0'
  return () => {
    style.visibility = prev.visibility
    style.opacity = prev.opacity
    style.left = prev.left
    style.top = prev.top
    style.zIndex = prev.zIndex
  }
}

function flipCanvasVertical(source: HTMLCanvasElement) {
  const flipped = document.createElement('canvas')
  flipped.width = source.width
  flipped.height = source.height
  const ctx = flipped.getContext('2d')
  if (!ctx) return source
  ctx.translate(0, flipped.height)
  ctx.scale(1, -1)
  ctx.drawImage(source, 0, 0)
  return flipped
}

function canvasToExportDataUrl(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  scale: number,
  flipVertical: boolean,
) {
  const expectedW = Math.round(width * scale)
  const expectedH = Math.round(height * scale)
  const fixed = document.createElement('canvas')
  fixed.width = expectedW
  fixed.height = expectedH
  const ctx = fixed.getContext('2d')
  if (!ctx) throw new Error('ページを書き出せませんでした')
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, expectedW, expectedH)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, expectedW, expectedH)
  let out: HTMLCanvasElement = fixed
  if (flipVertical) out = flipCanvasVertical(out)
  return out.toDataURL('image/png')
}

/** 表紙の裏など、何も印刷しない白紙ページ */
export function blankPageDataUrl(orientation: PageOrientation) {
  const { width, height } = pageDimensions(orientation)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('白紙ページを用意できませんでした')
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, width, height)
  return canvas.toDataURL('image/png')
}

export async function captureSheet(
  sheet: HTMLElement,
  orientation: PageOrientation,
  flipVertical = false,
) {
  const { width, height } = pageDimensions(orientation)
  const scale = captureScale()
  sheet.style.width = `${width}px`
  sheet.style.height = `${height}px`
  sheet.style.boxSizing = 'border-box'
  await waitForFonts()
  await waitForImages(sheet)
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

  const restoreRoot = mountExportRootForCapture(sheet)
  let canvas: HTMLCanvasElement
  try {
    canvas = await html2canvas(sheet, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: PAPER,
      logging: false,
      imageTimeout: 15000,
      onclone: (doc, cloned) => {
        const clonedRoot = doc.querySelector('.export-root')
        if (clonedRoot instanceof HTMLElement) {
          clonedRoot.style.visibility = 'visible'
          clonedRoot.style.opacity = '1'
        }
        const clonedSheet = cloned as HTMLElement
        clonedSheet.style.transform = 'none'
        clonedSheet.style.margin = '0'
        clonedSheet.style.boxShadow = 'none'
        clonedSheet.style.width = `${width}px`
        clonedSheet.style.height = `${height}px`
        clonedSheet.style.boxSizing = 'border-box'
        clonedSheet.style.overflow = 'hidden'
        clonedSheet.style.visibility = 'visible'
        clonedSheet.style.opacity = '1'
        doc.querySelectorAll(EXPORT_UI_SELECTOR).forEach((node) => node.remove())
        prepareClonedSheetForCapture(doc, sheet)
      },
    })
  } finally {
    restoreRoot()
  }

  if (canvas.width < 4 || canvas.height < 4) {
    throw new Error('ページの画像化に失敗しました')
  }

  return canvasToExportDataUrl(canvas, width, height, scale, flipVertical)
}

export async function buildPdf(images: string[], fileName: string, orientation: PageOrientation) {
  const pdf = new jsPDF({
    orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  const pageW = orientation === 'landscape' ? 297 : 210
  const pageH = orientation === 'landscape' ? 210 : 297
  images.forEach((image, index) => {
    if (index > 0) pdf.addPage()
    pdf.addImage(image, 'PNG', 0, 0, pageW, pageH, undefined, 'FAST')
  })
  pdf.save(fileName)
}
