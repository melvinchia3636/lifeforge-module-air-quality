import { useModuleTranslation } from '@lifeforge/localization'
import { Flex, Icon, Stack, Text } from '@lifeforge/ui'

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

  const bannerStyle = {
    backgroundColor: `${level.color}33`,
    border: `1px solid ${level.color}`
  }

  if (compact) {
    return (
      <Flex
        align="center"
        gap="sm"
        justify="center"
        p="sm"
        r="md"
        style={bannerStyle}
      >
        <Text size="3xl" style={{ color: level.color }} weight="bold">
          {aqi ?? '—'}
        </Text>
        <Flex align="center" gap="xs">
          <Icon icon={icon} size="1.25rem" style={{ color: level.color }} />
          <Text size="lg" style={{ color: level.color }} weight="bold">
            {label}
          </Text>
        </Flex>
      </Flex>
    )
  }

  return (
    <Stack gap="xs" width="100%">
      <Flex
        align="center"
        direction="column"
        gap={{ base: 'xs', sm: 'sm' }}
        justify="center"
        p={{ base: 'md', sm: 'lg' }}
        r="md"
        style={bannerStyle}
      >
        <Text
          size={{ base: '4xl', sm: '6xl' }}
          style={{ color: level.color }}
          weight="bold"
        >
          {aqi ?? '—'}
        </Text>
        <Flex align="center" gap="sm">
          <Icon
            icon={icon}
            size={{ base: '2rem', sm: '2.5rem' }}
            style={{ color: level.color }}
          />
          <Text
            size={{ base: 'xl', sm: '2xl' }}
            style={{ color: level.color }}
            weight="bold"
          >
            {label}
          </Text>
        </Flex>
      </Flex>
      {time && (
        <Text align="right" color="muted" mt="md" size="sm">
          {t('time.updated', { time: formatTime(time) })}
        </Text>
      )}
    </Stack>
  )
}

export default StationBanner
