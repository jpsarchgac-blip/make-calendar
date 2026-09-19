type BirdProps = {
  className?: string
}

export function BudgiePerched({ className }: BirdProps) {
  return (
    <svg className={className} viewBox="0 0 160 170" aria-hidden="true">
      <ellipse cx="80" cy="158" rx="42" ry="7" fill="currentColor" opacity="0.12" />
      <path d="M28 118c18 18 46 22 70 8 8-5 18-4 26 2" fill="none" stroke="#8a6a45" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="78" cy="102" rx="36" ry="32" fill="#74b06a" />
      <ellipse cx="98" cy="98" rx="20" ry="18" fill="#5b9458" />
      <path d="M40 108c-18 10 -22 32 -12 46 22-8 40-18 48-28" fill="#6aa7c4" />
      <circle cx="104" cy="62" r="26" fill="#f3d56b" />
      <ellipse cx="90" cy="66" rx="10" ry="8" fill="#f0c24d" />
      <path d="M126 64l18 4-18 7z" fill="#e08b3c" />
      <circle cx="114" cy="56" r="4.6" fill="#2c241c" />
      <circle cx="115.6" cy="54.6" r="1.5" fill="#fff" />
      <circle cx="92" cy="82" r="2.2" fill="#2c241c" />
      <circle cx="84" cy="88" r="1.8" fill="#2c241c" />
      <circle cx="96" cy="90" r="1.6" fill="#2c241c" />
      <path d="M70 128c6 10 18 12 28 4" fill="none" stroke="#4d7a48" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function BudgiePeek({ className }: BirdProps) {
  return (
    <svg className={className} viewBox="0 0 120 90" aria-hidden="true">
      <circle cx="58" cy="48" r="28" fill="#7dae6c" />
      <circle cx="78" cy="36" r="20" fill="#f3d56b" />
      <path d="M96 38l14 3-14 6z" fill="#e08b3c" />
      <circle cx="86" cy="32" r="3.6" fill="#2c241c" />
      <circle cx="87.2" cy="31" r="1.1" fill="#fff" />
      <ellipse cx="70" cy="44" rx="7" ry="5" fill="#f0c24d" />
      <circle cx="64" cy="58" r="1.8" fill="#2c241c" />
      <circle cx="56" cy="62" r="1.4" fill="#2c241c" />
    </svg>
  )
}

export function LeafSprig({ className }: BirdProps) {
  return (
    <svg className={className} viewBox="0 0 180 40" aria-hidden="true">
      <path d="M8 22c40-2 80 6 164 0" fill="none" stroke="#8aa56f" strokeWidth="2" />
      <ellipse cx="38" cy="14" rx="12" ry="7" fill="#9fc987" transform="rotate(-18 38 14)" />
      <ellipse cx="74" cy="28" rx="11" ry="6" fill="#b7d39a" transform="rotate(16 74 28)" />
      <ellipse cx="118" cy="13" rx="12" ry="7" fill="#8fbf7a" transform="rotate(-12 118 13)" />
      <ellipse cx="152" cy="27" rx="10" ry="6" fill="#d7e3a4" transform="rotate(14 152 27)" />
    </svg>
  )
}

/** 月ごとの小枝（1月=梅 … 12月=松と実） */
export function MonthLeafSprig({ monthIndex, className }: { monthIndex: number; className?: string }) {
  const m = monthIndex % 12
  const stem = 'M8 22c40-2 80 6 164 0'
  const stemStroke = m === 11 ? '#6a7a5a' : '#8aa56f'

  return (
    <svg className={className} viewBox="0 0 180 40" aria-hidden="true">
      <path d={stem} fill="none" stroke={stemStroke} strokeWidth="2" />
      {m === 0 ? (
        <>
          <circle cx="42" cy="12" r="4" fill="#e8a0b0" />
          <circle cx="52" cy="16" r="3.5" fill="#f0b8c4" />
          <circle cx="36" cy="18" r="3" fill="#d88a9a" />
          <ellipse cx="78" cy="26" rx="10" ry="5" fill="#a8c890" transform="rotate(12 78 26)" />
        </>
      ) : null}
      {m === 1 ? (
        <>
          <ellipse cx="44" cy="14" rx="9" ry="5" fill="#c8e0a8" transform="rotate(-20 44 14)" />
          <circle cx="58" cy="10" r="2.5" fill="#f5d4a8" />
          <circle cx="66" cy="14" r="2" fill="#f0c898" />
          <ellipse cx="120" cy="24" rx="11" ry="6" fill="#b7d39a" transform="rotate(-8 120 24)" />
        </>
      ) : null}
      {m === 2 ? (
        <>
          <circle cx="38" cy="14" r="5" fill="#f8c8d8" opacity="0.95" />
          <circle cx="50" cy="10" r="4.5" fill="#ffb8cc" />
          <circle cx="62" cy="15" r="4" fill="#f5a8c0" />
          <circle cx="72" cy="11" r="3.5" fill="#ffd0e0" />
          <ellipse cx="130" cy="22" rx="10" ry="5" fill="#9fd4a0" transform="rotate(10 130 22)" />
        </>
      ) : null}
      {m === 3 ? (
        <>
          <ellipse cx="40" cy="12" rx="11" ry="6" fill="#b8e8a0" transform="rotate(-16 40 12)" />
          <ellipse cx="72" cy="26" rx="12" ry="6" fill="#a8dc90" transform="rotate(14 72 26)" />
          <ellipse cx="108" cy="11" rx="10" ry="5" fill="#c8f0b0" transform="rotate(-10 108 11)" />
          <circle cx="148" cy="18" r="3" fill="#ffe8a0" />
        </>
      ) : null}
      {m === 4 ? (
        <>
          <ellipse cx="36" cy="14" rx="13" ry="7" fill="#88c878" transform="rotate(-18 36 14)" />
          <ellipse cx="78" cy="28" rx="12" ry="6" fill="#9fd488" transform="rotate(12 78 28)" />
          <ellipse cx="118" cy="12" rx="11" ry="6" fill="#7cb86a" transform="rotate(-8 118 12)" />
          <ellipse cx="152" cy="24" rx="10" ry="5" fill="#b8e0a0" transform="rotate(16 152 24)" />
        </>
      ) : null}
      {m === 5 ? (
        <>
          <ellipse cx="44" cy="13" rx="12" ry="6" fill="#6aaa58" transform="rotate(-14 44 13)" />
          <ellipse cx="86" cy="27" rx="11" ry="5" fill="#88c070" transform="rotate(10 86 27)" />
          <circle cx="118" cy="14" r="4" fill="#a8c8e8" opacity="0.85" />
          <circle cx="128" cy="18" r="3.5" fill="#98b8dc" opacity="0.85" />
          <ellipse cx="156" cy="22" rx="9" ry="5" fill="#9ad080" transform="rotate(8 156 22)" />
        </>
      ) : null}
      {m === 6 ? (
        <>
          <ellipse cx="38" cy="15" rx="11" ry="6" fill="#5a9850" transform="rotate(-12 38 15)" />
          <circle cx="72" cy="10" r="5" fill="#f0d858" />
          <circle cx="84" cy="14" r="4" fill="#e8c840" />
          <ellipse cx="122" cy="26" rx="12" ry="6" fill="#78b868" transform="rotate(14 122 26)" />
        </>
      ) : null}
      {m === 7 ? (
        <>
          <ellipse cx="42" cy="12" rx="12" ry="6" fill="#68a858" transform="rotate(-16 42 12)" />
          <circle cx="98" cy="16" r="6" fill="#f5c838" />
          <circle cx="108" cy="12" r="4" fill="#f0b828" />
          <ellipse cx="142" cy="24" rx="10" ry="5" fill="#88c878" transform="rotate(10 142 24)" />
        </>
      ) : null}
      {m === 8 ? (
        <>
          <ellipse cx="40" cy="14" rx="11" ry="6" fill="#98b868" transform="rotate(-14 40 14)" />
          <ellipse cx="78" cy="26" rx="10" ry="5" fill="#c8a050" transform="rotate(12 78 26)" />
          <ellipse cx="118" cy="11" rx="11" ry="6" fill="#d87848" transform="rotate(-10 118 11)" />
          <ellipse cx="150" cy="24" rx="9" ry="5" fill="#e8a058" transform="rotate(14 150 24)" />
        </>
      ) : null}
      {m === 9 ? (
        <>
          <ellipse cx="44" cy="13" rx="10" ry="5" fill="#d07040" transform="rotate(-18 44 13)" />
          <ellipse cx="76" cy="27" rx="11" ry="6" fill="#c85838" transform="rotate(12 76 27)" />
          <ellipse cx="116" cy="12" rx="10" ry="5" fill="#e08850" transform="rotate(-8 116 12)" />
          <ellipse cx="148" cy="22" rx="9" ry="5" fill="#a85030" transform="rotate(16 148 22)" />
        </>
      ) : null}
      {m === 10 ? (
        <>
          <ellipse cx="50" cy="16" rx="9" ry="5" fill="#a87848" transform="rotate(-12 50 16)" />
          <ellipse cx="92" cy="24" rx="8" ry="4" fill="#8a6040" transform="rotate(10 92 24)" />
          <ellipse cx="128" cy="14" rx="7" ry="4" fill="#b89060" transform="rotate(-14 128 14)" />
          <path d="M152 28c4-6 10-8 14-4" fill="none" stroke="#9a7050" strokeWidth="1.5" />
        </>
      ) : null}
      {m === 11 ? (
        <>
          <path d="M36 20c8-10 16-12 22-6" fill="none" stroke="#5a6848" strokeWidth="2" />
          <path d="M100 24c6-8 14-10 20-4" fill="none" stroke="#5a6848" strokeWidth="2" />
          <ellipse cx="62" cy="10" rx="14" ry="8" fill="#3d6840" transform="rotate(-25 62 10)" />
          <ellipse cx="138" cy="12" rx="12" ry="7" fill="#456848" transform="rotate(18 138 12)" />
          <circle cx="118" cy="26" r="3" fill="#c84848" />
          <circle cx="126" cy="28" r="2.5" fill="#d85858" />
        </>
      ) : null}
    </svg>
  )
}
