import {
  Box,
  Button,
  ErrorScreen,
  Flex,
  colorWithOpacity
} from '@lifeforge/ui'

import AirQualityLegend from './components/AirQualityLegend'
import StationTooltip from './components/StationTooltip'
import { useAirQualityMap } from './hooks/useAirQualityMap'

function AirQualityMap() {
  const { containerRef, locate, locating, stationsQuery } = useAirQualityMap()

  return (
    <Box
      shadow
      flex="1"
      mb="xl"
      minHeight="0"
      overflow="hidden"
      position="relative"
      r="lg"
      width="100%"
    >
      <Box ref={containerRef} height="100%" width="100%" zIndex="0" />
      <Button
        bottom="1rem"
        icon="tabler:current-location"
        loading={locating}
        position="absolute"
        right="1rem"
        zIndex="10"
        onClick={locate}
      />
      <AirQualityLegend />
      {stationsQuery.isError && (
        <Flex
          align="center"
          bg={colorWithOpacity('bg-950', '60%')}
          inset="0"
          justify="center"
          position="absolute"
          zIndex="20"
        >
          <ErrorScreen showRetryButton message={stationsQuery.error.message} />
        </Flex>
      )}
      <StationTooltip />
    </Box>
  )
}

export default AirQualityMap
