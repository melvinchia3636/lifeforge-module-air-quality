interface CurrentPoint {
  key: string
  value: number
}

interface SeriesEntry {
  key: string
  values: (number | null)[]
}

interface AqiLevel {
  max: number
  color: string
  key: string
  label: string
  icon: string
}

const AQI_LEVELS: AqiLevel[] = [
  {
    max: 50,
    color: '#009966',
    key: 'good',
    label: 'Good',
    icon: 'tabler:mood-happy'
  },
  {
    max: 100,
    color: '#ffde33',
    key: 'moderate',
    label: 'Moderate',
    icon: 'tabler:mood-smile'
  },
  {
    max: 150,
    color: '#ff9933',
    key: 'unhealthySensitive',
    label: 'Unhealthy for Sensitive Groups',
    icon: 'tabler:mood-neutral'
  },
  {
    max: 200,
    color: '#cc0033',
    key: 'unhealthy',
    label: 'Unhealthy',
    icon: 'tabler:mood-sad'
  },
  {
    max: 300,
    color: '#660099',
    key: 'veryUnhealthy',
    label: 'Very Unhealthy',
    icon: 'tabler:mood-cry'
  },
  {
    max: Infinity,
    color: '#7e0023',
    key: 'hazardous',
    label: 'Hazardous',
    icon: 'tabler:skull'
  }
]

const UNKNOWN_LEVEL: AqiLevel = {
  max: Infinity,
  color: '#9ca3af',
  key: 'unknown',
  label: 'Unknown',
  icon: 'tabler:mood-neutral'
}

const WEATHER_COLORS: Record<string, string> = {
  h: '#3b82f6',
  p: '#14b8a6',
  t: '#f59e0b',
  w: '#3b82f6'
}

const ROWS = [
  { key: 'aqi', label: 'AQI' },
  { key: 'pm25', label: 'PM2.5' },
  { key: 'pm10', label: 'PM10' },
  { key: 'pm1', label: 'PM1' },
  { key: 'o3', label: 'O3' },
  { key: 'no2', label: 'NO2' },
  { key: 'so2', label: 'SO2' },
  { key: 'co', label: 'CO' },
  { key: 'h', label: 'R.H.' },
  { key: 'p', label: 'Press' },
  { key: 't', label: 'Temp' },
  { key: 'w', label: 'Wind' }
]

function getLevel(aqi: number | null): AqiLevel {
  if (aqi === null) {
    return UNKNOWN_LEVEL
  }

  return AQI_LEVELS.find(level => aqi <= level.max) ?? AQI_LEVELS[0]
}

function toGray(hex: string): string {
  const value = hex.replace('#', '')

  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)

  const luminance = 0.299 * r + 0.587 * g + 0.114 * b

  const gray = Math.round(40 + (luminance / 255) * 160)

  return `rgb(${gray}, ${gray}, ${gray})`
}

function colorFor(key: string, value: number): string {
  if (key in WEATHER_COLORS) {
    return WEATHER_COLORS[key]
  }

  return getLevel(value).color
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function generateStationImageHTML({
  name,
  aqi,
  current,
  series
}: {
  name: string
  aqi: number | null
  start: number
  step: number
  current: CurrentPoint[]
  series: SeriesEntry[]
}): string {
  const subIndexKeys = ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co']

  const resolvedAqi =
    aqi ??
    (() => {
      const candidates = current
        .filter(item => subIndexKeys.includes(item.key))
        .map(item => item.value)

      return candidates.length > 0 ? Math.max(...candidates) : null
    })()

  const currentMap = new Map(current.map(({ key, value }) => [key, value]))

  if (resolvedAqi !== null) {
    currentMap.set('aqi', resolvedAqi)
  }

  const seriesMap = new Map(series.map(({ key, values }) => [key, values]))

  const level = getLevel(resolvedAqi)

  const rowsHtml = ROWS.filter(
    row => currentMap.has(row.key) || seriesMap.has(row.key)
  )
    .map(row => {
      const values = seriesMap.get(row.key) ?? []

      const numeric = values.filter((value): value is number => value !== null)

      const min = numeric.length > 0 ? Math.min(...numeric) : 0

      const max = numeric.length > 0 ? Math.max(...numeric) : 0

      const range = max - min || 1

      const bars = values
        .map(value => {
          if (value === null) {
            return '<div class="bar"></div>'
          }

          const height = 15 + 85 * ((value - min) / range)

          return `<div class="bar" style="height:${height}%;background:${toGray(colorFor(row.key, value))}"></div>`
        })
        .join('')

      return `
        <div class="row">
          <div class="row-top">
            <span class="row-label">${row.label}</span>
            <span class="row-current">${currentMap.get(row.key) ?? '—'}</span>
          </div>
          <div class="bars">${bars}</div>
          <div class="row-range">
            <span>${min}</span>
            <span>${max}</span>
          </div>
        </div>
      `
    })
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <script src="https://code.iconify.design/iconify-icon/2.3.0/iconify-icon.min.js"></script>
      <style>
        * {
          box-sizing: border-box;
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }
        body {
          margin: 0;
          width: 384px;
          background: #ffffff;
          color: #000000;
          border: 2px solid #000000;
          padding: 16px;
        }
        header {
          display: flex;
          flex-direction: column;
          gap: 2px;
          border-bottom: 2px solid #000000;
          padding-bottom: 8px;
        }
        .title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .powered {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          letter-spacing: 0.03em;
        }
        .station {
          margin-top: 10px;
          font-size: 13px;
          font-weight: 600;
        }
        .banner {
          margin-top: 8px;
          border: 2px solid #000000;
          border-radius: 2px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px;
        }
        .banner .aqi {
          font-size: 44px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.02em;
        }
        .banner .level {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          font-weight: 600;
        }
        .rows {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .row-top {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }
        .row-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        .row-current {
          font-size: 14px;
          font-weight: 600;
        }
        .bars {
          display: flex;
          align-items: flex-end;
          gap: 1px;
          height: 28px;
          margin-top: 3px;
        }
        .bar {
          flex: 1;
          min-width: 0;
          border-radius: 2px 2px 0 0;
        }
        .row-range {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          margin-top: 1px;
        }
        footer {
          margin-top: 12px;
          border-top: 2px solid #000000;
          padding-top: 8px;
          text-align: center;
          font-size: 11px;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <header>
        <div class="title">
          <iconify-icon icon="tabler:wind" width="22" height="22"></iconify-icon>
          <span>Air Quality</span>
        </div>
        <div class="powered">
          <span>powered by</span>
          <iconify-icon icon="tabler:hammer" width="14" height="14"></iconify-icon>
          <span style="font-weight:600">Lifeforge.</span>
        </div>
      </header>
      <div class="station">${escapeHtml(name)}</div>
      <div class="banner">
        <div class="aqi">${resolvedAqi ?? '—'}</div>
        <div class="level">
          <iconify-icon icon="${level.icon}" width="20" height="20"></iconify-icon>
          <span>${level.label}</span>
        </div>
      </div>
      <div class="rows">${rowsHtml}</div>
      <footer>[Computer Generated Report]</footer>
    </body>
    </html>
  `
}
