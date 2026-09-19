import footprintUrl from './assets/footprint.png'

export const FOOTPRINT_TINT_COLORS = [
  '#e88fa8',
  '#7bc47f',
  '#f0b35c',
  '#6eb8d4',
  '#e8c84a',
  '#a8a0d8',
  '#98d48a',
  '#f0a078',
  '#d87898',
  '#58b0c8',
] as const

const tintCache = new Map<string, string>()
let baseLoad: Promise<HTMLImageElement> | null = null

function loadBaseFootprint() {
  if (!baseLoad) {
    baseLoad = new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('足跡画像を読み込めませんでした'))
      img.src = footprintUrl
    })
  }
  return baseLoad
}

/** PDFでも崩れない、色付き足跡（キャンバス合成） */
export async function tintedFootprintDataUrl(color: string): Promise<string> {
  if (tintCache.has(color)) return tintCache.get(color)!
  const base = await loadBaseFootprint()
  const w = base.naturalWidth
  const h = base.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return footprintUrl
  ctx.drawImage(base, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
  const url = canvas.toDataURL('image/png')
  tintCache.set(color, url)
  return url
}

export async function warmupFootprintTints(colors: string[]) {
  const unique = [...new Set(colors)]
  await Promise.all(unique.map((color) => tintedFootprintDataUrl(color)))
}

export { footprintUrl }
