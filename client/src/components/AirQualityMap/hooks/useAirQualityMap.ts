import { useQuery } from '@tanstack/react-query'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'

import { useModuleTranslation } from '@lifeforge/localization'
import { toast, useModalStore, usePersonalization } from '@lifeforge/ui'

import { forgeAPI } from '@/manifest'
import { getAqiLevel, getContrastColor } from '@/utils/aqi'

import StationDetailModal from '../../StationDetailModal'

const MALAYSIA_BOUNDS = [
  [0.85, 99.6],
  [7.5, 119.3]
] as [[number, number], [number, number]]

const MALAYSIA_VIEW = { south: 0.85, west: 99.6, north: 7.5, east: 119.3 }

export function useAirQualityMap() {
  const { t } = useModuleTranslation()
  const { derivedTheme } = usePersonalization()
  const { open } = useModalStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const openRef = useRef(open)
  const hasAutoLocatedRef = useRef(false)
  const [bounds, setBounds] = useState(MALAYSIA_VIEW)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    openRef.current = open
  }, [open])

  const stationsQuery = useQuery(
    forgeAPI.getStations
      .input({
        south: bounds.south.toFixed(3),
        west: bounds.west.toFixed(3),
        north: bounds.north.toFixed(3),
        east: bounds.east.toFixed(3)
      })
      .queryOptions({ staleTime: 1000 * 60 })
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current)

    map.fitBounds(MALAYSIA_BOUNDS)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map)

    layerRef.current = L.layerGroup().addTo(map)

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
    })

    resizeObserver.observe(containerRef.current)

    const updateBounds = () => {
      const mapBounds = map.getBounds()

      setBounds({
        south: mapBounds.getSouth(),
        west: mapBounds.getWest(),
        north: mapBounds.getNorth(),
        east: mapBounds.getEast()
      })
    }

    map.on('moveend', updateBounds)
    updateBounds()

    mapRef.current = map

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const tilePane = mapRef.current?.getPane('tilePane')

    if (!tilePane) return

    tilePane.style.filter =
      derivedTheme === 'dark'
        ? 'invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9)'
        : ''
  }, [derivedTheme])

  useEffect(() => {
    const layer = layerRef.current

    if (!layer) return

    layer.clearLayers()

    stationsQuery.data?.forEach(station => {
      const level = getAqiLevel(station.aqi)

      const label = station.aqi === null ? '—' : String(station.aqi)

      const marker = L.marker([station.lat, station.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="position:absolute;left:0;top:0;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;height:22px;min-width:24px;padding:0 7px;border-radius:9999px;background:${level.color};border:2px solid #ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.3);color:${getContrastColor(level.color)};font-size:11px;font-weight:600;line-height:1;white-space:nowrap;">${label}</div>`,
          iconSize: [0, 0]
        })
      }).addTo(layer)

      marker.on('click', () => {
        openRef.current(StationDetailModal, station)
      })

      const element = marker.getElement()

      if (element) {
        element.style.cursor = 'pointer'
        element.setAttribute('data-tooltip-id', 'aqi-station')
        element.setAttribute('data-station-name', station.name)
        element.setAttribute('data-station-aqi', station.aqi?.toString() ?? '')
        element.setAttribute('data-station-time', station.time)
        element.setAttribute('data-station-color', level.color)
      }
    })
  }, [stationsQuery.data])

  useEffect(() => {
    if (hasAutoLocatedRef.current || !stationsQuery.isSuccess) return

    hasAutoLocatedRef.current = true

    locate()
  }, [stationsQuery.isSuccess, locate])

  function locate() {
    if (!('geolocation' in navigator)) {
      toast.error(t('location.unsupported'))

      return
    }

    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      position => {
        setLocating(false)

        mapRef.current?.setView(
          [position.coords.latitude, position.coords.longitude],
          11
        )
      },
      () => {
        setLocating(false)
        toast.error(t('location.denied'))
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return { containerRef, locate, locating, stationsQuery }
}
