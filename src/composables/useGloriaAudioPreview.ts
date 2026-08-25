import { useAppStore } from '@/stores/app'

let previewAudio: HTMLAudioElement | null = null
let activeOwner = ''
let activeSource = ''
let stopTimer: ReturnType<typeof setTimeout> | null = null
let fadeTimer: ReturnType<typeof setInterval> | null = null

function clearTimers(): void {
  if (stopTimer) {
    clearTimeout(stopTimer)
    stopTimer = null
  }
  if (fadeTimer) {
    clearInterval(fadeTimer)
    fadeTimer = null
  }
}

function getAudio(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined')
    return null
  if (!previewAudio) {
    previewAudio = new Audio()
    previewAudio.preload = 'metadata'
    previewAudio.addEventListener('ended', () => {
      activeOwner = ''
      activeSource = ''
      clearTimers()
    })
  }
  return previewAudio
}

function finishStop(audio: HTMLAudioElement): void {
  audio.pause()
  audio.removeAttribute('src')
  audio.load()
  activeOwner = ''
  activeSource = ''
  clearTimers()
}

function fadeOut(audio: HTMLAudioElement): void {
  clearTimers()
  const initialVolume = audio.volume
  const steps = 6
  let step = 0
  fadeTimer = setInterval(() => {
    step += 1
    audio.volume = Math.max(0, initialVolume * (1 - step / steps))
    if (step >= steps)
      finishStop(audio)
  }, 50)
}

export function useGloriaAudioPreview() {
  const appStore = useAppStore()

  function getTrackSource(track: string | null | undefined): string {
    if (!track)
      return ''
    return appStore.fanAudioTrackSources[track] ?? ''
  }

  function getRegionTrack(region: string | null | undefined): string {
    if (!region)
      return ''
    return appStore.regionAudioTracks[region.toUpperCase()] ?? ''
  }

  function canPreviewTrack(track: string | null | undefined): boolean {
    return appStore.fanAudioPreviewEnabled && Boolean(getTrackSource(track))
  }

  function canPreviewRegion(region: string | null | undefined): boolean {
    return canPreviewTrack(getRegionTrack(region))
  }

  async function previewTrack(owner: string, track: string | null | undefined): Promise<boolean> {
    if (!appStore.fanAudioPreviewEnabled)
      return false

    const source = getTrackSource(track)
    const audio = getAudio()
    if (!source || !audio)
      return false

    if (activeOwner === owner && activeSource === source && !audio.paused)
      return true

    clearTimers()
    audio.pause()
    activeOwner = owner
    activeSource = source
    audio.src = source
    audio.currentTime = 0
    audio.volume = appStore.fanAudioPreviewVolume / 100

    try {
      await audio.play()
      stopTimer = setTimeout(fadeOut, appStore.fanAudioPreviewDuration * 1000, audio)
      return true
    }
    catch {
      finishStop(audio)
      return false
    }
  }

  function previewRegion(owner: string, region: string | null | undefined): Promise<boolean> {
    return previewTrack(owner, getRegionTrack(region))
  }

  function stopPreview(owner?: string): void {
    const audio = previewAudio
    if (!audio || audio.paused || (owner && owner !== activeOwner))
      return
    fadeOut(audio)
  }

  return {
    canPreviewRegion,
    canPreviewTrack,
    getRegionTrack,
    previewRegion,
    previewTrack,
    stopPreview,
  }
}
