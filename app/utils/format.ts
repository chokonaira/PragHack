const LOCATION_LABELS: Record<string, string> = {
  CZ_PHA_NUSLE: 'Prague Nusle',
  CZ_BRN_CENTRUM: 'Brno Centrum'
}

export function locationLabel(code: string): string {
  if (LOCATION_LABELS[code]) return LOCATION_LABELS[code]
  return code
    .replace(/^[A-Z]{2}_[A-Z]{3}_/, '')
    .toLowerCase()
    .replace(/(^|_)(\w)/g, (_m, sep: string, ch: string) => (sep ? ' ' : '') + ch.toUpperCase())
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000]
]

export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = new Date(iso).getTime() - now
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit)
  }
  return 'just now'
}
