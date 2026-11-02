import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { boundsOf, type MapPoint } from '../lib/mapPoints'

interface Props {
  center: { lat: number; lon: number }
  points: MapPoint[]
  /** 핀이 하나뿐이거나 없을 때의 확대 정도 */
  zoom?: number
  height?: number
  onSelect?: (id: string) => void
}

const COLORS: Record<MapPoint['kind'], string> = {
  sight: '#7c83e6',
  food: '#f08a4b',
  saved: '#e5484d',
}

/**
 * 오픈스트리트맵 지도 (TODO 7-2). 타일 이용 정책에 따라 출처를 지도 오른쪽 아래에 늘 표시하고,
 * 보고 있는 범위의 타일만 불러온다(미리 받아 두기 없음).
 */
export function PlaceMap({ center, points, zoom = 14, height = 320, onSelect }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const select = useRef(onSelect)

  useEffect(() => {
    select.current = onSelect
  })

  useEffect(() => {
    if (!box.current) return
    const m = L.map(box.current, { scrollWheelZoom: false }).setView([center.lat, center.lon], zoom)
    m.attributionControl.setPrefix(false)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> 기여자',
    }).addTo(m)
    map.current = m
    layer.current = L.layerGroup().addTo(m)
    return () => {
      m.remove()
      map.current = null
    }
  }, [center.lat, center.lon, zoom])

  useEffect(() => {
    const m = map.current
    const group = layer.current
    if (!m || !group) return
    group.clearLayers()
    for (const p of points) {
      const marker = L.circleMarker([p.lat, p.lon], {
        radius: p.kind === 'saved' ? 9 : 7,
        color: '#fff',
        weight: 2,
        fillColor: COLORS[p.kind],
        fillOpacity: 0.95,
      })
      marker.bindTooltip(p.label, { direction: 'top', offset: [0, -6] })
      marker.on('click', () => select.current?.(p.id))
      marker.addTo(group)
    }
    const bounds = boundsOf(points)
    if (bounds && points.length > 1) m.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 })
    else if (points.length === 1) m.setView([points[0].lat, points[0].lon], zoom)
  }, [points, zoom])

  return <div ref={box} className="place-map" style={{ height }} role="application" aria-label="지도" />
}
