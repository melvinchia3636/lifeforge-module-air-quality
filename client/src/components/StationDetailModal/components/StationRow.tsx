import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import { Box, Flex, Stack, Text } from '@lifeforge/ui'

import RowTooltip from './RowTooltip'

function StationRow({
  label,
  values,
  current,
  start,
  step,
  colorFor
}: {
  label: string
  values: (number | null)[]
  current: number | undefined
  start: number
  step: number
  colorFor: (value: number) => string
}) {
  const numeric = values.filter((value): value is number => value !== null)

  const min = numeric.length > 0 ? Math.min(...numeric) : 0

  const max = numeric.length > 0 ? Math.max(...numeric) : 0

  const data = values.map((value, index) => ({
    time: new Date((start + index * step) * 1000).toLocaleString(undefined, {
      weekday: 'short',
      hour: 'numeric'
    }),
    v: value 
  }))

  const domain: [number, number] = min === max ? [min - 1, max + 1] : [min, max]

  return (
    <Flex
      align="end"
      direction={{ base: 'column', sm: 'row' }}
      gap={{ base: 'xs', sm: 'md' }}
      width="100%"
    >
      <Flex
        align="center"
        flexShrink="0"
        gap="md"
        justify={{ base: 'between', sm: 'start' }}
        width={{ base: '100%', sm: 'auto' }}
      >
        <Box flexShrink="0" width={{ base: 'auto', sm: '3rem' }}>
          <Text size="sm">{label}</Text>
        </Box>
        <Box flexShrink="0" width={{ base: 'auto', sm: '4rem' }}>
          <Text size="2xl" weight="semibold">
            {current ?? '—'}
          </Text>
        </Box>
      </Flex>
      <Flex
        align="center"
        flex={{ base: 'none', sm: '1' }}
        gap={{ base: 'sm', sm: 'md' }}
        minWidth="0"
        width={{ base: '100%', sm: 'auto' }}
      >
        <Box flex="1" height="2.25rem" minWidth="0" width="100%">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              barCategoryGap={0}
              data={data}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <XAxis hide dataKey="time" />
              <YAxis hide domain={domain} />
              <Tooltip
                allowEscapeViewBox={{ x: true, y: true }}
                content={props => <RowTooltip {...props} rowLabel={label} />}
                cursor={false}
                wrapperStyle={{ zIndex: 100 }}
              />
              <Bar dataKey="v" isAnimationActive={false} radius={[2, 2, 0, 0]}>
                {data.map((point, index) => (
                  <Cell
                    key={index}
                    fill={point.v === null ? 'transparent' : colorFor(point.v)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Stack flexShrink="0" gap="none" width="2.5rem">
          <Text align="right" color="dangerous" size="sm">
            {max}
          </Text>
          <Text align="right" color="blue-500" size="sm">
            {min}
          </Text>
        </Stack>
      </Flex>
    </Flex>
  )
}

export default StationRow
