export type PhotoTransform = {
  /** 1 = 等倍、大きいほど拡大（枠内でクロップ） */
  scale: number
  /** 0–100（object-position 相当） */
  x: number
  y: number
}

export function defaultPhotoTransform(): PhotoTransform {
  return { scale: 1, x: 50, y: 50 }
}

export function clampTransform(t: PhotoTransform): PhotoTransform {
  return {
    scale: Math.min(3, Math.max(0.5, t.scale)),
    x: Math.min(100, Math.max(0, t.x)),
    y: Math.min(100, Math.max(0, t.y)),
  }
}
