import { useQuery } from '@tanstack/react-query'

import type { InferOutput } from '@lifeforge/api'
import { Box, ModalHeader, Stack, WithQuery } from '@lifeforge/ui'

import { forgeAPI } from '@/manifest'

import StationBanner from './components/StationBanner'
import StationChart from './components/StationChart'

type Station = InferOutput<typeof forgeAPI.getStations>[number]

function StationDetailModal({
  onClose,
  data: station
}: {
  onClose: () => void
  data: Station
}) {
  const detailQuery = useQuery(
    forgeAPI.getStationDetail.input({ idx: station.id }).queryOptions({
      retry: false,
      staleTime: 1000 * 60 * 5
    })
  )

  return (
    <Box minWidth={{ base: '100%', md: '44rem' }}>
      <ModalHeader
        icon="tabler:wind"
        subtitle={station.name}
        title="Station Details"
        onClose={onClose}
      />
      <Stack gap="lg" width="100%">
        <StationBanner aqi={station.aqi} time={station.time} />
        <WithQuery query={detailQuery}>
          {detail => <StationChart detail={detail} />}
        </WithQuery>
      </Stack>
    </Box>
  )
}

export default StationDetailModal
