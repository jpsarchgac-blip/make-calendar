import type { PhotoTransform } from './photoTransform'

function readTransform(img: HTMLImageElement): PhotoTransform {
  const scale = Number(img.dataset.scale ?? '1')
  const x = Number(img.dataset.x ?? '50')
  const y = Number(img.dataset.y ?? '50')
  return { scale: Number.isFinite(scale) ? scale : 1, x, y }
}

/** object-fit: cover + object-position + scale（中央原点）に近い描画 */
function drawCoverCrop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number,
  transform: PhotoTransform,
) {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (!iw || !ih || cw <= 0 || ch <= 0) return

  const ir = iw / ih
  const cr = cw / ch
  let baseW: number
  let baseH: number
  if (ir > cr) {
    baseH = ch
    baseW = baseH * ir
  } else {
    baseW = cw
    baseH = baseW / ir
  }

  const { scale, x, y } = transform
  const dw = baseW * scale
  const dh = baseH * scale
  const ox = (cw - dw) * (x / 100)
  const oy = (ch - dh) * (y / 100)
  ctx.drawImage(img, ox, oy, dw, dh)
}

function bakeFramedPhoto(container: HTMLElement, doc: Document, sourceContainer?: HTMLElement) {
  const img = container.querySelector('img')
  if (!(img instanceof HTMLImageElement)) return
  if (container.dataset.exportBaked === '1') return

  const sourceImg = sourceContainer?.querySelector('img')
  const drawImg =
    sourceImg instanceof HTMLImageElement && sourceImg.naturalWidth > 0 ? sourceImg : img

  const cw = sourceContainer?.clientWidth || container.clientWidth || container.offsetWidth
  const ch = sourceContainer?.clientHeight || container.clientHeight || container.offsetHeight
  if (cw < 2 || ch < 2) return
  if (!drawImg.naturalWidth || !drawImg.naturalHeight) return

  const canvas = doc.createElement('canvas')
  canvas.width = Math.round(cw)
  canvas.height = Math.round(ch)
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  drawCoverCrop(ctx, drawImg, cw, ch, readTransform(img))

  const baked = doc.createElement('img')
  baked.src = canvas.toDataURL('image/png')
  baked.alt = ''
  baked.draggable = false
  baked.style.display = 'block'
  baked.style.width = '100%'
  baked.style.height = '100%'
  container.replaceChildren(baked)
  container.dataset.exportBaked = '1'
}

const TEXT_EXPORT_SELECTOR =
  '.date-event, .date-holiday, .date-kinenbi, .date-num, .footer-event-title, .front-footer li span, .event-day, .cover-title, .front-month-ja, .front-title, .memo-pad'

/** html2canvas は -webkit-line-clamp で文字の下半分が欠けることがある */
function fixTextLayoutForExport(doc: Document) {
  doc.querySelectorAll(TEXT_EXPORT_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLElement)) return
    node.style.display = 'block'
    node.style.overflow = 'visible'
    node.style.lineHeight = '1.4'
    node.style.paddingBottom = '2px'
    node.style.maxHeight = 'none'
    node.style.setProperty('-webkit-line-clamp', 'unset')
    node.style.setProperty('-webkit-box-orient', 'unset')
  })
  doc.querySelectorAll('.date-cell-events').forEach((node) => {
    if (node instanceof HTMLElement) node.style.overflow = 'visible'
  })
}

/** html2canvas 用クローン内で、マスク・object-fit 依存を実ピクセルに焼く */
export function prepareClonedSheetForCapture(doc: Document, sourceSheet: HTMLElement) {
  const clonedSheet = doc.querySelector('.sheet')
  if (clonedSheet instanceof HTMLElement) {
    clonedSheet.classList.add('sheet-export-capture')
  }
  fixTextLayoutForExport(doc)

  const sources = [...sourceSheet.querySelectorAll('.framed-photo')]
  const targets = [...doc.querySelectorAll('.framed-photo')]
  targets.forEach((node, index) => {
    if (!(node instanceof HTMLElement)) return
    const source = sources[index]
    bakeFramedPhoto(node, doc, source instanceof HTMLElement ? source : undefined)
  })
}
