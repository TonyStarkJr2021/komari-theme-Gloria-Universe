<script setup lang="ts">
import type { NodeData } from '@/stores/nodes'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useGloriaAudioPreview } from '@/composables/useGloriaAudioPreview'
import { useNodeGeoClusters } from '@/composables/useNodeGeoClusters'
import { getCoordByCode } from '@/utils/geoHelper'
import { getRegionDisplayName } from '@/utils/regionHelper'

type Position = [number, number]
type PolygonCoordinates = Position[][]
type MultiPolygonCoordinates = Position[][][]

interface GeoFeature {
  properties: Record<string, unknown>
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: PolygonCoordinates | MultiPolygonCoordinates
  }
}

interface MapCountry {
  id: string
  code: string
  name: string
  path: string
}

interface CountryMarker {
  code: string
  highlightCode: string
  label: string
  servers: number
  onlineServers: number
  x: number
  y: number
}

const props = defineProps<{ nodes?: NodeData[], paused?: boolean }>()
const MAP_WIDTH = 1000
const MAP_HEIGHT = 500
const LATITUDE_TOP = 84
const LATITUDE_BOTTOM = -60
const ISO_COUNTRY_CODE_REGEX = /^[A-Z]{2}$/
const countries = ref<MapCountry[]>([])
const activeCode = ref('')
const activeMarkerCode = ref('')
const mapLoadFailed = ref(false)
const { canPreviewRegion, getRegionTrack, previewRegion, stopPreview } = useGloriaAudioPreview()

const { regionClusters, totalServers, onlineServers } = useNodeGeoClusters({ nodes: () => props.nodes })

const COUNTRY_HIGHLIGHT_FALLBACK: Record<string, string> = {
  HK: 'CN',
  MO: 'CN',
}

function project(position: Position): { x: number, y: number } {
  const [longitude, latitude] = position
  return {
    x: ((longitude + 180) / 360) * MAP_WIDTH,
    y: ((LATITUDE_TOP - Math.max(LATITUDE_BOTTOM, Math.min(LATITUDE_TOP, latitude))) / (LATITUDE_TOP - LATITUDE_BOTTOM)) * MAP_HEIGHT,
  }
}

function ringPath(ring: Position[]): string {
  return `${ring.map((position, index) => {
    const point = project(position)
    return `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`
  }).join(' ')} Z`
}

function geometryPath(feature: GeoFeature): string {
  if (feature.geometry.type === 'Polygon')
    return (feature.geometry.coordinates as PolygonCoordinates).map(ringPath).join(' ')
  return (feature.geometry.coordinates as MultiPolygonCoordinates)
    .flatMap(polygon => polygon.map(ringPath))
    .join(' ')
}

function featureCode(properties: Record<string, unknown>): string {
  const preferred = String(properties.ISO_A2_EH || '').toUpperCase()
  const fallback = String(properties.ISO_A2 || '').toUpperCase()
  return ISO_COUNTRY_CODE_REGEX.test(preferred) ? preferred : (ISO_COUNTRY_CODE_REGEX.test(fallback) ? fallback : '')
}

const markers = computed<CountryMarker[]>(() => {
  const countryTotals = new Map<string, { servers: number, onlineServers: number, label: string, coord: [number, number] }>()

  for (const cluster of regionClusters.value) {
    const code = cluster.code.toUpperCase()
    if (!ISO_COUNTRY_CODE_REGEX.test(code))
      continue
    const existing = countryTotals.get(code)
    const coord = getCoordByCode(code) ?? cluster.coord
    if (existing) {
      existing.servers += cluster.servers
      existing.onlineServers += cluster.onlineServers
    }
    else {
      countryTotals.set(code, {
        servers: cluster.servers,
        onlineServers: cluster.onlineServers,
        label: getRegionDisplayName(code) || cluster.label || code,
        coord,
      })
    }
  }

  return Array.from(countryTotals.entries()).map(([code, data]) => {
    const point = project([data.coord[1], data.coord[0]])
    return {
      code,
      highlightCode: COUNTRY_HIGHLIGHT_FALLBACK[code] ?? code,
      label: data.label,
      servers: data.servers,
      onlineServers: data.onlineServers,
      ...point,
    }
  })
})

const activeMarker = computed(() => markers.value.find(marker => marker.code === activeMarkerCode.value) ?? null)
const activeMarkerAudioTrack = computed(() => {
  const marker = activeMarker.value
  return marker && canPreviewRegion(marker.code) ? getRegionTrack(marker.code) : ''
})

function markerAudioOwner(code: string): string {
  return `region:${code}`
}

function activateMarker(marker: CountryMarker): void {
  activeCode.value = marker.highlightCode
  activeMarkerCode.value = marker.code
  void previewRegion(markerAudioOwner(marker.code), marker.code)
}

function clearMarker(): void {
  if (activeMarkerCode.value)
    stopPreview(markerAudioOwner(activeMarkerCode.value))
  activeCode.value = ''
  activeMarkerCode.value = ''
}

onBeforeUnmount(clearMarker)

onMounted(async () => {
  try {
    const response = await fetch('/data/gloria-world-countries.geojson')
    if (!response.ok)
      throw new Error(`Map data request failed: ${response.status}`)
    const collection = await response.json() as { features: GeoFeature[] }
    countries.value = collection.features.map((feature, index) => ({
      id: `${featureCode(feature.properties) || 'country'}-${index}`,
      code: featureCode(feature.properties),
      name: String(feature.properties.ADMIN || ''),
      path: geometryPath(feature),
    }))
  }
  catch {
    mapLoadFailed.value = true
  }
})
</script>

<template>
  <div class="gloria-world-map" :class="{ 'gloria-world-map--paused': paused }">
    <div class="gloria-world-map__heading">
      <span>GLORIA STAR NETWORK</span>
      <small>{{ markers.length }} REGIONS · {{ onlineServers }} / {{ totalServers }} STARS ONLINE</small>
    </div>

    <svg
      class="gloria-world-map__svg"
      viewBox="0 0 1000 500"
      role="img"
      aria-label="节点所在国家与地区的 GLORIA 星网地图"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="gloria-country-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="gloria-marker-glow" x="-300%" y="-300%" width="600%" height="600%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g class="gloria-world-map__grid" aria-hidden="true">
        <path v-for="x in [125, 250, 375, 500, 625, 750, 875]" :key="`x-${x}`" :d="`M${x},15 V485`" />
        <path v-for="y in [100, 200, 300, 400]" :key="`y-${y}`" :d="`M20,${y} H980`" />
      </g>

      <g v-if="!mapLoadFailed" class="gloria-world-map__countries">
        <path
          v-for="country in countries"
          :key="country.id"
          :d="country.path"
          :data-country-code="country.code || undefined"
          :aria-label="country.name"
          :class="{ 'is-active': country.code && country.code === activeCode }"
        />
      </g>

      <g class="gloria-world-map__markers">
        <g
          v-for="marker in markers"
          :key="marker.code"
          class="gloria-world-map__marker"
          :class="{ 'is-active': marker.code === activeMarkerCode, 'is-offline': marker.onlineServers === 0 }"
          :transform="`translate(${marker.x} ${marker.y})`"
          :data-map-marker-code="marker.code"
          role="button"
          tabindex="0"
          :aria-label="`${marker.label}，${marker.onlineServers}/${marker.servers} 个节点在线`"
          @mouseenter="activateMarker(marker)"
          @mouseleave="clearMarker"
          @focus="activateMarker(marker)"
          @blur="clearMarker"
        >
          <circle class="gloria-world-map__pulse" r="13" />
          <circle class="gloria-world-map__halo" r="8" />
          <circle class="gloria-world-map__dot" r="4.2" />
        </g>
      </g>
    </svg>

    <div class="gloria-world-map__status" aria-live="polite">
      <template v-if="activeMarker">
        <strong>{{ activeMarker.label }}</strong>
        <span :class="{ 'is-offline': activeMarker.onlineServers === 0 }">
          {{ activeMarker.onlineServers }} / {{ activeMarker.servers }} {{ activeMarker.onlineServers > 0 ? 'STARS ONLINE' : 'STARS OFFLINE' }}
        </span>
        <span v-if="activeMarkerAudioTrack">♫ 《{{ activeMarkerAudioTrack }}》</span>
      </template>
      <template v-else>
        <strong>STAR NETWORK</strong>
        <span>HOVER A STAR TO LIGHT ITS REGION</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.gloria-world-map {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 72% 42%, rgb(139 92 246 / 0.2), transparent 31%),
    radial-gradient(circle at 24% 68%, rgb(14 165 233 / 0.1), transparent 30%),
    linear-gradient(135deg, #040616 0%, #090922 52%, #040615 100%);
}

.gloria-world-map::before {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent 0 4px, rgb(125 211 252 / 0.026) 5px),
    linear-gradient(105deg, transparent 16%, rgb(244 114 182 / 0.05) 45%, transparent 63%);
  content: '';
  pointer-events: none;
}

.gloria-world-map__heading {
  position: absolute;
  z-index: 2;
  top: 0.82rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  color: #93e7ff;
  font-family: var(--font-display);
  letter-spacing: 0.13em;
  pointer-events: none;
}

.gloria-world-map__heading span {
  font-size: 0.63rem;
}
.gloria-world-map__heading small {
  margin-top: 0.2rem;
  color: rgb(221 212 255 / 0.72);
  font-size: 0.45rem;
}

.gloria-world-map__svg {
  position: absolute;
  inset: 1.85rem 0 1.55rem;
  width: 100%;
  height: calc(100% - 3.4rem);
}

.gloria-world-map__grid path {
  fill: none;
  stroke: rgb(96 165 250 / 0.075);
  stroke-dasharray: 2 8;
  stroke-width: 0.8;
}

.gloria-world-map__countries path {
  fill: rgb(99 102 241 / 0.105);
  fill-rule: evenodd;
  stroke: rgb(147 197 253 / 0.38);
  stroke-linejoin: round;
  stroke-width: 0.78;
  transition:
    fill 180ms ease,
    stroke 180ms ease,
    stroke-width 180ms ease,
    filter 180ms ease;
}

.gloria-world-map__countries path.is-active {
  fill: rgb(34 197 94 / 0.37);
  stroke: #86efac;
  stroke-width: 2;
  filter: url(#gloria-country-glow);
}

.gloria-world-map__marker {
  cursor: pointer;
  outline: none;
}
.gloria-world-map__pulse {
  fill: none;
  stroke: #f59e0b;
  stroke-width: 2;
  transform-box: fill-box;
  transform-origin: center;
  animation: gloria-map-pulse 2.1s ease-out infinite;
}
.gloria-world-map__halo {
  fill: rgb(245 158 11 / 0.26);
}
.gloria-world-map__dot {
  fill: #fde68a;
  stroke: #f59e0b;
  stroke-width: 1.5;
  filter: url(#gloria-marker-glow);
}
.gloria-world-map__marker.is-active .gloria-world-map__halo {
  fill: rgb(134 239 172 / 0.45);
}
.gloria-world-map__marker.is-active .gloria-world-map__dot {
  fill: #dcfce7;
  stroke: #4ade80;
}
.gloria-world-map__marker.is-offline .gloria-world-map__pulse {
  stroke: #ef4444;
}
.gloria-world-map__marker.is-offline .gloria-world-map__halo {
  fill: rgb(239 68 68 / 0.3);
}
.gloria-world-map__marker.is-offline .gloria-world-map__dot {
  fill: #fecaca;
  stroke: #ef4444;
}
.gloria-world-map__marker.is-active.is-offline .gloria-world-map__halo {
  fill: rgb(251 113 133 / 0.5);
}
.gloria-world-map__marker.is-active.is-offline .gloria-world-map__dot {
  fill: #fff1f2;
  stroke: #fb7185;
}

.gloria-world-map__status {
  position: absolute;
  z-index: 2;
  right: 1rem;
  bottom: 0.64rem;
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  font-family: var(--font-display);
  pointer-events: none;
}
.gloria-world-map__status strong {
  color: #f9f5ff;
  font-size: 0.56rem;
  letter-spacing: 0.11em;
}
.gloria-world-map__status span {
  color: #75defd;
  font-size: 0.42rem;
  letter-spacing: 0.08em;
}
.gloria-world-map__status span.is-offline {
  color: #fb7185;
}

:global(:root:not(.dark) .gloria-world-map) {
  background:
    radial-gradient(circle at 76% 38%, rgb(167 139 250 / 0.2), transparent 34%),
    radial-gradient(circle at 22% 70%, rgb(34 211 238 / 0.15), transparent 34%),
    linear-gradient(135deg, rgb(255 255 255 / 0.68), rgb(238 232 255 / 0.58) 52%, rgb(232 249 255 / 0.62));
}

:global(:root:not(.dark) .gloria-world-map::before) {
  background:
    repeating-linear-gradient(0deg, transparent 0 4px, rgb(109 53 199 / 0.035) 5px),
    linear-gradient(105deg, transparent 16%, rgb(244 114 182 / 0.09) 45%, transparent 63%);
}

:global(:root:not(.dark) .gloria-world-map__heading) {
  color: #4f2b89;
  text-shadow: 0 1px rgb(255 255 255 / 0.9);
}

:global(:root:not(.dark) .gloria-world-map__heading small) {
  color: #594868;
}

:global(:root:not(.dark) .gloria-world-map__grid path) {
  stroke: rgb(109 53 199 / 0.12);
}

:global(:root:not(.dark) .gloria-world-map__countries path) {
  fill: rgb(124 58 237 / 0.1);
  stroke: rgb(79 70 229 / 0.4);
}

:global(:root:not(.dark) .gloria-world-map__countries path.is-active) {
  fill: rgb(34 197 94 / 0.42);
  stroke: #15803d;
}

:global(:root:not(.dark) .gloria-world-map__status strong) {
  color: #24113f;
  text-shadow: 0 1px rgb(255 255 255 / 0.9);
}

:global(:root:not(.dark) .gloria-world-map__status span) {
  color: #006d8f;
  font-weight: 700;
}

.gloria-world-map--paused .gloria-world-map__pulse {
  animation-play-state: paused;
}

@keyframes gloria-map-pulse {
  0% {
    opacity: 0.95;
    transform: scale(0.45);
  }
  72%,
  100% {
    opacity: 0;
    transform: scale(1.65);
  }
}

@media (max-width: 767px) {
  .gloria-world-map__heading {
    top: 0.7rem;
    left: 0.75rem;
  }
  .gloria-world-map__svg {
    inset: 2.1rem 0 1.8rem;
    height: calc(100% - 3.9rem);
  }
  .gloria-world-map__status {
    right: 0.72rem;
    bottom: 0.55rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gloria-world-map__pulse {
    animation: none;
    opacity: 0.7;
  }
}
</style>
