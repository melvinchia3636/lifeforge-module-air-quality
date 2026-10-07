export const AQI_LEVELS = [
  { max: 50, color: '#009966', key: 'good' },
  { max: 100, color: '#ffde33', key: 'moderate' },
  { max: 150, color: '#ff9933', key: 'unhealthySensitive' },
  { max: 200, color: '#cc0033', key: 'unhealthy' },
  { max: 300, color: '#660099', key: 'veryUnhealthy' },
  { max: Infinity, color: '#7e0023', key: 'hazardous' }
] as const

export const UNKNOWN_COLOR = '#9ca3af'

export const AQI_LEVEL_ICONS = {
  good: 'tabler:mood-happy',
  moderate: 'tabler:mood-smile',
  unhealthySensitive: 'tabler:mood-neutral',
  unhealthy: 'tabler:mood-sad',
  veryUnhealthy: 'tabler:mood-cry',
  hazardous: 'tabler:skull'
} as const

export const WEATHER_COLORS: Record<string, string> = {
  h: '#3b82f6',
  p: '#14b8a6',
  t: '#f59e0b',
  w: '#3b82f6'
}

export const WEATHER_KEYS = new Set(['h', 'p', 't', 'w'])

export function getAqiLevel(aqi: number | null) {
  if (aqi === null) {
    return { color: UNKNOWN_COLOR, key: 'unknown' as const }
  }

  return AQI_LEVELS.find(level => aqi <= level.max) ?? AQI_LEVELS[0]
}

export function getBarColor(key: string, value: number) {
  if (WEATHER_KEYS.has(key)) {
    return WEATHER_COLORS[key]
  }

  return getAqiLevel(value).color
}

export function getContrastColor(hex: string) {
  const value = hex.replace('#', '')

  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)

  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
    ? '#111827'
    : '#ffffff'
}
