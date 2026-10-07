import { useModuleTranslation } from '@lifeforge/localization'
import { Box, Card, Flex, Text } from '@lifeforge/ui'

import { AQI_LEVELS, UNKNOWN_COLOR } from '@/utils/aqi'

const LEGEND = [
  ...AQI_LEVELS.map(({ color, key }) => ({ color, key })),
  { color: UNKNOWN_COLOR, key: 'unknown' }
]

function AirQualityLegend() {
  const { t } = useModuleTranslation()

  return (
    <Card
      bottom="1rem"
      gap={{ base: 'sm', md: 'md' }}
      left="1rem"
      position="absolute"
      width="max-content"
      zIndex="10"
    >
      {LEGEND.map(level => (
        <Flex key={level.key} align="center" gap="sm">
          <Box
            flexShrink="0"
            height="0.75rem"
            r="full"
            style={{ backgroundColor: level.color }}
            width="0.75rem"
          />
          <Text size="xs" whiteSpace="nowrap">
            {t(`aqi.${level.key}`)}
          </Text>
        </Flex>
      ))}
    </Card>
  )
}

export default AirQualityLegend
