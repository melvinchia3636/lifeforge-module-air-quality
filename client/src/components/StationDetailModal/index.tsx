import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import type { InferOutput } from '@lifeforge/api'
import { useForgeMutation } from '@lifeforge/api'
import { useModuleTranslation } from '@lifeforge/localization'
import {
  Box,
  ContextMenu,
  ContextMenuItem,
  ModalHeader,
  Stack,
  WithQuery,
  toast
} from '@lifeforge/ui'

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
  const { t } = useModuleTranslation()
  const [downloading, setDownloading] = useState(false)

  const detailQuery = useQuery(
    forgeAPI.getStationDetail.input({ idx: station.id }).queryOptions({
      retry: false,
      staleTime: 1000 * 60 * 5
    })
  )

  const setStationMutation = useForgeMutation(forgeAPI.selection.set, {
    action: 'update',
    queryKey: forgeAPI.selection.key,
    onSuccess: () => {
      toast.success(t('toast.displayedInWidget'))
    }
  })

  const selectionQuery = useQuery(forgeAPI.selection.get.queryOptions())

  const isSelected = selectionQuery.data?.station?.station_id === station.id

  async function handleDownloadImage() {
    setDownloading(true)

    try {
      const response = await forgeAPI.image
        .input({ idx: station.id, t: Date.now().toString() })
        .query()

      const blob =
        response instanceof Blob
          ? response
          : new Blob([response as BlobPart], { type: 'image/png' })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.download = `air-quality-${station.id}.png`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t('toast.imageFailed'))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Box minWidth={{ base: '100%', md: '44rem' }}>
      <ModalHeader
        icon="tabler:wind"
        subtitle={station.name}
        title="Station Details"
        trailing={
          <ContextMenu>
            <ContextMenuItem
              icon="tabler:download"
              label="downloadImage"
              loading={downloading}
              shouldCloseMenuOnClick={false}
              onClick={handleDownloadImage}
            />
            <ContextMenuItem
              disabled={isSelected}
              icon="tabler:layout-dashboard"
              label="displayInWidget"
              loading={setStationMutation.isPending}
              shouldCloseMenuOnClick={false}
              onClick={() => {
                setStationMutation.mutate({
                  stationId: station.id,
                  name: station.name,
                  lat: station.lat,
                  lng: station.lng
                })
              }}
            />
          </ContextMenu>
        }
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
