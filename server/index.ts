import puppeteer from 'puppeteer-core'
import z from 'zod'

import { forgeRouter, writeContractFileToClient } from '@lifeforge/server-utils'

import forge from './forge'
import { generateStationImageHTML } from './utils/generateStationImageHTML'
import { httpsJson } from './utils/http'
import {
  type Api2Series,
  type SeriesPoint,
  alignSeries,
  decodeApi2Series,
  pm10ToAqi,
  pm25ToAqi
} from './utils/station'

const TOKEN_TTL = 1000 * 60 * 30
const DETAIL_CACHE_TTL = 1000 * 60 * 10

const BROWSER_HEADERS: Record<string, string> = {
  Accept: '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  Origin: 'https://aqicn.org',
  Pragma: 'no-cache',
  Priority: 'u=4',
  Referer: 'https://aqicn.org/',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'cross-site',
  'Sec-GPC': '1',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:157.0) Gecko/20100101 Firefox/157.0'
}

const FORM_HEADERS = {
  ...BROWSER_HEADERS,
  'Content-Type': 'application/x-www-form-urlencoded'
}

interface Api2TokenResponse {
  rxs?: { obs?: Array<{ msg?: { token?: string } }> }
}

interface Api2FeedResponse {
  rxs?: {
    obs?: Array<{
      msg?:
        | {
            aqi?: number
            dominentpol?: string
            city?: { name?: string }
            time?: { iso?: string; tz?: string }
            iaqi?: Record<string, { v: number } | undefined>
            obs?: Record<string, Api2Series | undefined>
          }
        | string
    }>
  }
}

interface WaqiBoundsResponse {
  data?: Array<{
    idx: string
    aqi: string | null
    utime?: string
    geo: [number, number]
    name: string
  }>
}

interface AirnetHourlyResponse {
  feed?: Record<string, [number, number] | undefined>
  data?: Record<string, Array<{ time: string; mean: number }> | undefined>
  meta?: { name?: string; utime?: number }
}

interface WeatherEntry {
  h?: number
  p?: number
  t?: number
  ws?: number
}

interface AirnetCwopResponse {
  data?: { data?: Record<string, WeatherEntry | undefined> }
}

const detailOutput = z.object({
  idx: z.string(),
  start: z.number(),
  step: z.number(),
  current: z.array(z.object({ key: z.string(), value: z.number() })),
  series: z.array(
    z.object({
      key: z.string(),
      values: z.array(z.number().nullable())
    })
  )
})

interface StationDetailData {
  name: string
  aqi: number | null
  start: number
  step: number
  current: { key: string; value: number }[]
  series: { key: string; values: (number | null)[] }[]
}

const tokenCache = new Map<string, { token: string; expires: number }>()

const detailCache = new Map<
  string,
  { data: StationDetailData; expires: number }
>()

async function getApi2Token(id: string) {
  const cached = tokenCache.get(id)

  if (cached && cached.expires > Date.now()) {
    return cached.token
  }

  const json = await httpsJson<Api2TokenResponse>(
    `https://api2.waqi.info/api/token/${encodeURIComponent(id)}`,
    { method: 'POST', headers: FORM_HEADERS, body: '' }
  )

  const token = json.rxs?.obs?.[0]?.msg?.token

  if (!token) {
    throw new Error('Failed to obtain AQICN token')
  }

  tokenCache.set(id, { token, expires: Date.now() + TOKEN_TTL })

  return token
}

let airnetKeyCache: { key: string; expires: number } | null = null

async function getAirnetKey() {
  if (airnetKeyCache && airnetKeyCache.expires > Date.now()) {
    return airnetKeyCache.key
  }

  const json = await httpsJson<{ key?: string }>(
    'https://airnet.waqi.info/airnet/token',
    { method: 'POST', headers: FORM_HEADERS, body: '' }
  )

  if (!json.key) {
    throw new Error('Failed to obtain airnet key')
  }

  airnetKeyCache = { key: json.key, expires: Date.now() + TOKEN_TTL }

  return json.key
}

async function buildAirnetDetail(
  idx: string
): Promise<StationDetailData | null> {
  const key = await getAirnetKey()

  const id = encodeURIComponent(idx.slice(1))

  const query = `key=${encodeURIComponent(key)}`

  const [hourly, cwop] = await Promise.all([
    httpsJson<AirnetHourlyResponse>(
      `https://airnet.waqi.info/airnet/feed/hourly/${id}?${query}`,
      { headers: BROWSER_HEADERS }
    ),
    httpsJson<AirnetCwopResponse>(
      `https://airnet.waqi.info/airnet/feed/cwop/${id}?${query}`,
      { headers: BROWSER_HEADERS }
    ).catch(() => null)
  ])

  const pm25 = hourly.data?.pm25

  const pm10 = hourly.data?.pm10

  const pm1 = hourly.data?.pm1

  if (!pm25 || !pm10) {
    return null
  }

  const hourOf = (time: string) => Math.floor(Date.parse(time) / 1000)

  const seriesMap: { key: string; points: SeriesPoint[] }[] = [
    {
      key: 'pm25',
      points: pm25.map(({ time, mean }) => ({
        t: hourOf(time),
        v: pm25ToAqi(mean)
      }))
    },
    {
      key: 'pm10',
      points: pm10.map(({ time, mean }) => ({
        t: hourOf(time),
        v: pm10ToAqi(mean)
      }))
    }
  ]

  if (pm1) {
    seriesMap.push({
      key: 'pm1',
      points: pm1.map(({ time, mean }) => ({
        t: hourOf(time),
        v: pm25ToAqi(mean)
      }))
    })
  }

  const cwopData = cwop?.data?.data

  if (cwopData) {
    const entries = Object.entries(cwopData).filter(
      (entry): entry is [string, WeatherEntry] => entry[1] !== undefined
    )

    const pushWeather = (
      key: string,
      pick: (entry: WeatherEntry) => number
    ) => {
      seriesMap.push({
        key,
        points: entries.map(([time, entry]) => ({
          t: hourOf(time),
          v: pick(entry)
        }))
      })
    }

    pushWeather('h', entry => entry.h ?? 0)
    pushWeather('p', entry => entry.p ?? 0)
    pushWeather('t', entry => entry.t ?? 0)
    pushWeather('w', entry => entry.ws ?? 0)
  }

  const aligned = alignSeries(seriesMap, 72, 3600)

  const byKey = new Map(
    aligned.series.map(series => [series.key, series.values])
  )

  const pm25Values = byKey.get('pm25') ?? []

  const pm10Values = byKey.get('pm10') ?? []

  const pm1Values = byKey.get('pm1') ?? []

  const aqiValues = pm25Values.map((_, index) =>
    Math.round(
      Math.max(
        pm25Values[index] ?? 0,
        pm10Values[index] ?? 0,
        pm1Values[index] ?? 0
      )
    )
  )

  const feed = hourly.feed ?? {}

  const subIndex = {
    pm25: feed.pm25 ? Math.round(pm25ToAqi(feed.pm25[1] / 100)) : null,
    pm10: feed.pm10 ? Math.round(pm10ToAqi(feed.pm10[1] / 100)) : null,
    pm1: feed.pm1 ? Math.round(pm25ToAqi(feed.pm1[1] / 100)) : null
  }

  const current: { key: string; value: number }[] = []

  for (const key of ['pm25', 'pm10', 'pm1'] as const) {
    const value = subIndex[key]

    if (value !== null) {
      current.push({ key, value })
    }
  }

  const aqi = Math.max(
    subIndex.pm25 ?? 0,
    subIndex.pm10 ?? 0,
    subIndex.pm1 ?? 0
  )

  if (aqi > 0) {
    current.push({ key: 'aqi', value: aqi })
  }

  if (cwopData) {
    const latest = Object.entries(cwopData)
      .filter(
        (entry): entry is [string, WeatherEntry] => entry[1] !== undefined
      )
      .sort(([a], [b]) => a.localeCompare(b))
      .at(-1)?.[1]

    if (latest) {
      current.push(
        { key: 'h', value: latest.h ?? 0 },
        { key: 'p', value: latest.p ?? 0 },
        { key: 't', value: latest.t ?? 0 },
        { key: 'w', value: latest.ws ?? 0 }
      )
    }
  }

  return {
    name: hourly.meta?.name ?? '',
    aqi: aqi > 0 ? aqi : null,
    start: aligned.start,
    step: aligned.step,
    current,
    series: [{ key: 'aqi', values: aqiValues }, ...aligned.series]
  }
}

const getStations = forge
  .query({
    description: 'Get air quality monitoring stations within a bounding box',
    input: {
      query: z.object({
        south: z.string(),
        west: z.string(),
        north: z.string(),
        east: z.string()
      })
    },
    output: {
      OK: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          lat: z.number(),
          lng: z.number(),
          aqi: z.number().nullable(),
          time: z.string()
        })
      )
    }
  })
  .callback(async ({ query: { south, west, north, east }, response }) => {
    const bounds = [west, south, east, north].join(',')

    let data: WaqiBoundsResponse

    try {
      data = await httpsJson<WaqiBoundsResponse>(
        `https://mapq.waqi.info/mapq2/bounds?bounds=${bounds}&inc=placeholders&viewer=webgl&markers=all`
      )
    } catch {
      return response.badRequest('Failed to fetch stations')
    }

    const stations = (data.data ?? [])
      .filter(({ geo }) => geo.every(Number.isFinite))
      .map(({ idx, name, geo, aqi, utime }) => {
        const parsedAqi = aqi === null || aqi.trim() === '' ? NaN : Number(aqi)

        return {
          id: idx,
          name,
          lat: geo[0],
          lng: geo[1],
          aqi: Number.isFinite(parsedAqi) ? parsedAqi : null,
          time: utime ?? ''
        }
      })

    return response.ok(stations)
  })

async function resolveStationDetail(
  idx: string
): Promise<StationDetailData | null> {
  const cached = detailCache.get(idx)

  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  let result: StationDetailData | null = null

  if (idx.startsWith('A')) {
    result = await buildAirnetDetail(idx)
  } else {
    const token = await getApi2Token(idx)

    const body = new URLSearchParams({ token, id: idx }).toString()

    const json = await httpsJson<Api2FeedResponse>(
      `https://api2.waqi.info/api/feed/@${encodeURIComponent(idx)}/aqi.json`,
      { method: 'POST', headers: FORM_HEADERS, body }
    )

    const entry = json.rxs?.obs?.find(item => typeof item.msg === 'object')

    const msg = typeof entry?.msg === 'object' ? entry.msg : undefined

    if (msg?.iaqi && msg.obs) {
      const tz = msg.time?.tz ?? '+00:00'

      const decoded = Object.entries(msg.obs).flatMap(([key, series]) =>
        series ? [{ key, points: decodeApi2Series(series, tz) }] : []
      )

      const aligned = alignSeries(decoded, 72, 3600)

      const current = Object.entries(msg.iaqi).flatMap(([key, value]) =>
        value ? [{ key, value: value.v }] : []
      )

      const aqi = typeof msg.aqi === 'number' ? msg.aqi : null

      if (aqi !== null && !current.some(item => item.key === 'aqi')) {
        current.unshift({ key: 'aqi', value: aqi })
      }

      let series = aligned.series

      if (!series.some(item => item.key === 'aqi')) {
        const subIndexKeys = ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co']

        const subSeries = series.filter(item => subIndexKeys.includes(item.key))

        if (subSeries.length > 0) {
          const aqiValues = subSeries[0].values.map((_, index) =>
            Math.max(...subSeries.map(item => item.values[index] ?? 0))
          )

          series = [{ key: 'aqi', values: aqiValues }, ...series]
        }
      }

      result = {
        name: msg.city?.name ?? '',
        aqi,
        start: aligned.start,
        step: aligned.step,
        current,
        series
      }
    }
  }

  if (result) {
    detailCache.set(idx, {
      data: result,
      expires: Date.now() + DETAIL_CACHE_TTL
    })
  }

  return result
}

const getStationDetail = forge
  .query({
    description: 'Get detailed air quality data for a single station',
    input: {
      query: z.object({ idx: z.string() })
    },
    output: {
      OK: detailOutput
    }
  })
  .callback(async ({ query: { idx }, response }) => {
    let data: StationDetailData | null

    try {
      data = await resolveStationDetail(idx)
    } catch {
      return response.badRequest('Failed to fetch station data')
    }

    if (!data) {
      return response.badRequest('No data available for this station')
    }

    return response.ok({
      idx,
      start: data.start,
      step: data.step,
      current: data.current,
      series: data.series
    })
  })

const image = forge
  .query({
    encrypted: false,
    isDownloadable: true,
    noAuth: true,
    description:
      'Generate a 384px-wide black and white image of a station detail',
    input: {
      query: z.object({ idx: z.string(), t: z.string().optional() })
    },
    output: 'custom'
  })
  .callback(async ({ query: { idx }, res }) => {
    let data: StationDetailData | null

    try {
      data = await resolveStationDetail(idx)
    } catch {
      res.status(400).end()

      return
    }

    if (!data) {
      res.status(404).end()

      return
    }

    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    await page.setViewport({
      width: 384,
      height: 800,
      deviceScaleFactor: 2
    })
    await page.setContent(generateStationImageHTML(data))
    await page.evaluate(async () => {
      await document.fonts.ready

      if (typeof customElements !== 'undefined') {
        await customElements.whenDefined('iconify-icon').catch(() => {})
      }
      await new Promise(resolve => setTimeout(resolve, 600))
    })

    const imageBuffer = await page.screenshot({
      type: 'png',
      fullPage: true
    })

    await browser.close()

    const buffer = Buffer.isBuffer(imageBuffer)
      ? imageBuffer
      : Buffer.from(imageBuffer)

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.set('Content-Type', 'image/png')
    res.set('x-lifeforge-downloadable', 'true')
    res.status(200).end(buffer)
  })

const routes = forgeRouter({
  getStations,
  getStationDetail,
  image
})

writeContractFileToClient(routes, import.meta.dirname)

export default routes
