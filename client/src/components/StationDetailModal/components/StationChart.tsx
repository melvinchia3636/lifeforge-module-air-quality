import type { InferOutput } from '@lifeforge/api'
import { Stack } from '@lifeforge/ui'

import { forgeAPI } from '@/manifest'
import { getBarColor } from '@/utils/aqi'

import StationRow from './StationRow'

type StationDetail = InferOutput<typeof forgeAPI.getStationDetail>

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

function StationChart({ detail }: { detail: StationDetail }) {
  const currentMap = new Map(
    detail.current.map(({ key, value }) => [key, value])
  )

  const seriesMap = new Map(
    detail.series.map(({ key, values }) => [key, values])
  )

  return (
    <Stack gap="md" width="100%">
      {ROWS.filter(
        row => currentMap.has(row.key) || seriesMap.has(row.key)
      ).map(row => (
        <StationRow
          key={row.key}
          colorFor={value => getBarColor(row.key, value)}
          current={currentMap.get(row.key)}
          label={row.label}
          start={detail.start}
          step={detail.step}
          values={seriesMap.get(row.key) ?? []}
        />
      ))}
    </Stack>
  )
}

export default StationChart
