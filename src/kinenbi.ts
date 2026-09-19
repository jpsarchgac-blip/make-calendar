export type KinenbiMap = Map<string, string[]>

let cached: KinenbiMap | null = null

export function kinenbiKey(month: number, day: number) {
  return `${month}-${day}`
}

export async function loadKinenbi(): Promise<KinenbiMap> {
  if (cached) return cached
  const response = await fetch('/data/kinenbi.json')
  if (!response.ok) throw new Error('記念日データを読み込めませんでした')
  const data = (await response.json()) as Record<string, string[]>
  cached = new Map(Object.entries(data))
  return cached
}

export function getKinenbiForDay(map: KinenbiMap, month: number, day: number) {
  return map.get(kinenbiKey(month, day)) ?? []
}
