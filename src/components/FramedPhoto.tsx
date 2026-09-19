import type { PhotoTransform } from '../photoTransform'

type Props = {
  src: string
  alt?: string
  transform: PhotoTransform
  className?: string
}

export function FramedPhoto({ src, alt = '', transform, className }: Props) {
  const { scale, x, y } = transform
  return (
    <div className={className ? `framed-photo ${className}` : 'framed-photo'}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        data-scale={scale}
        data-x={x}
        data-y={y}
        style={{
          objectPosition: `${x}% ${y}%`,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  )
}
