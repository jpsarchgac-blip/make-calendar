import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const LIGHTBOX_USE_ZOOM =
  typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('zoom', '1')

type Props = {
  open: boolean
  onClose: () => void
  pageWidth: number
  pageHeight: number
  children: ReactNode
}

function measureScale(body: HTMLElement, pageWidth: number, pageHeight: number) {
  const pad = 12
  const w = body.clientWidth - pad
  const h = body.clientHeight - pad
  if (w < 40 || h < 40) return null
  const raw = Math.min(w / pageWidth, h / pageHeight)
  if (!Number.isFinite(raw) || raw <= 0) return null
  return raw
}

export function PreviewLightbox({ open, onClose, pageWidth, pageHeight, children }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  useEffect(() => {
    if (!open) return
    const body = bodyRef.current
    if (!body) return

    const sync = () => {
      const next = measureScale(body, pageWidth, pageHeight)
      if (next != null) setScale(next)
    }

    sync()
    const ro = new ResizeObserver(() => sync())
    ro.observe(body)
    window.addEventListener('resize', sync)
    document.addEventListener('fullscreenchange', sync)
    const t1 = window.setTimeout(sync, 50)
    const t2 = window.setTimeout(sync, 200)

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', sync)
      document.removeEventListener('fullscreenchange', sync)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose, pageWidth, pageHeight])

  if (!open) return null

  const fitW = pageWidth * scale
  const fitH = pageHeight * scale

  const pageStyle: CSSProperties = LIGHTBOX_USE_ZOOM
    ? { width: pageWidth, height: pageHeight, zoom: scale }
    : {
        width: pageWidth,
        height: pageHeight,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="カレンダープレビュー拡大">
      <div className="lightbox-toolbar">
        <span className="lightbox-hint">余白をクリックで閉じる · Esc</span>
        <button type="button" className="ghost lightbox-close" onClick={onClose}>閉じる</button>
      </div>
      <div ref={bodyRef} className="lightbox-body" onClick={onClose}>
        <div
          className="lightbox-fit"
          style={{ width: fitW, height: fitH }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="lightbox-page" style={pageStyle}>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
