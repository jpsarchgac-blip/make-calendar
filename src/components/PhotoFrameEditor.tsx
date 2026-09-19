import { useRef } from 'react'
import { clampTransform, type PhotoTransform } from '../photoTransform'
import type { Photo } from '../types'
import { FramedPhoto } from './FramedPhoto'

type Props = {
  label: string
  photo: Photo | null
  transform: PhotoTransform
  onChange: (transform: PhotoTransform) => void
  previewClassName?: string
}

export function PhotoFrameEditor({ label, photo, transform, onChange, previewClassName }: Props) {
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  function patch(part: Partial<PhotoTransform>) {
    onChange(clampTransform({ ...transform, ...part }))
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!photo) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, ox: transform.x, oy: transform.y }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = ((e.clientX - dragRef.current.x) / rect.width) * -100
    const dy = ((e.clientY - dragRef.current.y) / rect.height) * -100
    onChange(
      clampTransform({
        ...transform,
        x: dragRef.current.ox + dx,
        y: dragRef.current.oy + dy,
      }),
    )
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault()
    const next = transform.scale + (e.deltaY < 0 ? 0.08 : -0.08)
    patch({ scale: next })
  }

  if (!photo) {
    return <p className="hint">写真を選ぶと、拡大・位置を調整できます。</p>
  }

  return (
    <div className="frame-editor">
      <p className="frame-editor-label">{label}</p>
      <div
        className={`frame-editor-preview${previewClassName ? ` ${previewClassName}` : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <FramedPhoto src={photo.dataUrl} transform={transform} />
        <span className="frame-editor-hint">ドラッグで位置 · ホイールで拡大</span>
      </div>
      <label>
        拡大
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.05}
          value={transform.scale}
          onChange={(e) => patch({ scale: Number(e.target.value) })}
        />
        <span className="range-value">{Math.round(transform.scale * 100)}%</span>
      </label>
      <div className="row-2">
        <label>
          横位置
          <input
            type="range"
            min={0}
            max={100}
            value={transform.x}
            onChange={(e) => patch({ x: Number(e.target.value) })}
          />
        </label>
        <label>
          縦位置
          <input
            type="range"
            min={0}
            max={100}
            value={transform.y}
            onChange={(e) => patch({ y: Number(e.target.value) })}
          />
        </label>
      </div>
      <button type="button" className="ghost compact" onClick={() => onChange(clampTransform({ scale: 1, x: 50, y: 50 }))}>
        位置をリセット
      </button>
    </div>
  )
}
