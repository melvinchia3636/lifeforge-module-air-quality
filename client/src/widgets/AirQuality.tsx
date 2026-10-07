import { useQuery } from '@tanstack/react-query'

import type { WidgetConfig } from '@lifeforge/configs'
import {
  Box,
  EmptyStateScreen,
  Flex,
  Icon,
  Stack,
  Text,
  Widget,
  WithQuery,
  WithQueryData
} from '@lifeforge/ui'

import StationBanner from '@/components/StationDetailModal/components/StationBanner'
import StationRow from '@/components/StationDetailModal/components/StationRow'
import { forgeAPI } from '@/manifest'
import { getBarColor } from '@/utils/aqi'

const COMPACT_ROWS = [
  { key: 'aqi', label: 'AQI' },
  { key: 'pm25', label: 'PM2.5' },
  { key: 'pm10', label: 'PM10' }
]

function StationDetail({ idx, name }: { idx: string; name: string }) {
  const detailQuery = useQuery(
    forgeAPI.getStationDetail.input({ idx }).queryOptions({
      retry: false,
      staleTime: 1000 * 60 * 5
    })
  )

  return (
    <WithQuery query={detailQuery}>
      {detail => {
        const currentMap = new Map(
          detail.current.map(({ key, value }) => [key, value])
        )

        const seriesMap = new Map(
          detail.series.map(({ key, values }) => [key, values])
        )

        return (
          <Stack gap="md" width="100%">
            <Flex align="center" gap="sm">
              <Icon icon="tabler:map-pin" />
              <Text truncate weight="medium">
                {name}
              </Text>
            </Flex>
            <Box mb="sm">
              <StationBanner
                compact
                aqi={currentMap.get('aqi') ?? null}
                time=""
              />
            </Box>
            {COMPACT_ROWS.filter(
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
      }}
    </WithQuery>
  )
}

function AirQuality() {
  return (
    <Widget icon="tabler:wind" title="Air Quality">
      <WithQueryData contract={forgeAPI.selection.get}>
        {({ station }) =>
          station ? (
            <StationDetail idx={station.station_id} name={station.name} />
          ) : (
            <EmptyStateScreen
              smaller
              icon="tabler:wind"
              message={{ id: 'station', tKey: 'widgets.airQuality' }}
            />
          )
        }
      </WithQueryData>
    </Widget>
  )
}

export default AirQuality

export const config: WidgetConfig = {
  id: 'airQuality',
  icon: 'tabler:wind',
  minW: 2,
  minH: 3
}
