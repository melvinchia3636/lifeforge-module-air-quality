import { useModuleTranslation } from '@lifeforge/localization'
import {
  Bordered,
  Flex,
  Icon,
  Stack,
  Text,
  colorWithOpacity
} from '@lifeforge/ui'

import { AQI_LEVEL_ICONS, getAqiLevel } from '@/utils/aqi'

function formatTime(time: string) {
  if (!time) return ''

  return new Date(time).toLocaleString(undefined, {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function StationBanner({
  aqi,
  time,
  compact = false
}: {
  aqi: number | null
  time: string
  compact?: boolean
}) {
  const { t } = useModuleTranslation()

  const level = getAqiLevel(aqi)

  const icon =
    AQI_LEVEL_ICONS[level.key as keyof typeof AQI_LEVEL_ICONS] ??
    'tabler:mood-neutral'

  const label = t(`aqi.${level.key}`)

  if (compact) {
    return (
      <Bordered asChild borderColor="custom-500" borderWidth="1px" r="md">
        <Flex
          align="center"
          bg={colorWithOpacity('custom-500', '20%')}
          gap="sm"
          justify="center"
          p="sm"
        >
          <Text color="primary" size="3xl" weight="bold">
            {aqi ?? '—'}
          </Text>
          <Flex align="center" gap="xs">
            <Icon color="primary" icon={icon} size="1.25rem" />
            <Text color="primary" size="lg" weight="bold">
              {label}
            </Text>
          </Flex>
        </Flex>
      </Bordered>
    )
  }

  return (
    <Stack gap="xs" width="100%">
      <Bordered asChild borderColor="custom-500" borderWidth="1px" r="md">
        <Flex
          align="center"
          bg={colorWithOpacity('custom-500', '20%')}
          direction="column"
          gap={{ base: 'xs', sm: 'sm' }}
          justify="center"
          p={{ base: 'md', sm: 'lg' }}
        >
          <Text color="primary" size={{ base: '4xl', sm: '6xl' }} weight="bold">
            {aqi ?? '—'}
          </Text>
          <Flex align="center" gap="sm">
            <Icon
              color="primary"
              icon={icon}
              size={{ base: '2rem', sm: '2.5rem' }}
            />
            <Text
              color="primary"
              size={{ base: 'xl', sm: '2xl' }}
              weight="bold"
            >
              {label}
            </Text>
          </Flex>
        </Flex>
      </Bordered>
      {time && (
        <Text align="right" color="muted" mt="md" size="sm">
          {t('time.updated', { time: formatTime(time) })}
        </Text>
      )}
    </Stack>
  )
}

export default StationBanner
