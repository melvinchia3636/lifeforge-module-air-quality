import { Stack, Text } from '@lifeforge/ui'

function RowTooltip({
  active,
  payload,
  label,
  rowLabel
}: {
  active?: boolean
  payload?: Array<{ value?: number | string | Array<number | string> }>
  label?: number | string
  rowLabel: string
}) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <Stack shadow bg={{ base: 'bg-50', dark: 'bg-800' }} p="md" r="sm">
      <Text as="div" color="muted" size="xs">
        {label}
      </Text>
      <Text as="div" size="sm" weight="medium">
        {rowLabel}: {payload[0].value ?? '—'}
      </Text>
    </Stack>
  )
}

export default RowTooltip
