export interface SeriesPoint {
  t: number
  v: number
}

const PM25_BREAKPOINTS: [number, number, number, number][] = [
  [0, 12.0, 0, 50],
  [12.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 150.4, 151, 200],
  [150.5, 250.4, 201, 300],
  [250.5, 350.4, 301, 400],
  [350.5, 500.4, 401, 500]
]

const PM10_BREAKPOINTS: [number, number, number, number][] = [
  [0, 54, 0, 50],
  [55, 154, 51, 100],
  [155, 254, 101, 150],
  [255, 354, 151, 200],
  [355, 424, 201, 300],
  [425, 504, 301, 400],
  [505, 604, 401, 500]
]

function interpolate(
  breakpoints: [number, number, number, number][],
  concentration: number
) {
  for (const [clo, chi, ilo, ihi] of breakpoints) {
    if (concentration <= chi) {
      return Math.round(
        ((ihi - ilo) / (chi - clo)) * (concentration - clo) + ilo
      )
    }
  }

  return 500
}

export function pm25ToAqi(concentration: number) {
  return interpolate(PM25_BREAKPOINTS, concentration)
}

export function pm10ToAqi(concentration: number) {
  return interpolate(PM10_BREAKPOINTS, concentration)
}

export interface Api2Series {
  d: number
  m: number
  s: string
  v: (number | [number, number])[]
}

export function decodeApi2Series(
  series: Api2Series,
  tz: string
): SeriesPoint[] {
  const { m, s, v } = series

  let t = Math.floor(new Date(`${s.replace(' ', 'T')}${tz}`).getTime() / 1000)

  let value = v[0] as number

  const points: SeriesPoint[] = [{ t, v: value / m }]

  for (let i = 1; i < v.length; i++) {
    const [delta, deltaT] = v[i] as [number, number]

    value += delta
    t += deltaT

    points.push({ t, v: value / m })
  }

  return points.reverse()
}

export function alignSeries(
  seriesMap: { key: string; points: SeriesPoint[] }[],
  hours: number,
  step: number
) {
  const allTimes = seriesMap.flatMap(({ points }) => points.map(({ t }) => t))

  if (allTimes.length === 0) {
    return {
      start: 0,
      step,
      series: [] as { key: string; values: (number | null)[] }[]
    }
  }

  const maxTime = Math.max(...allTimes)
  const start = maxTime - (hours - 1) * step

  const series = seriesMap.map(({ key, points }) => {
    const byTime = new Map(points.map(({ t, v }) => [t, v]))

    const values: (number | null)[] = []

    for (let t = start; t <= maxTime; t += step) {
      values.push(byTime.get(t) ?? null)
    }

    return { key, values }
  })

  return { start, step, series }
}
