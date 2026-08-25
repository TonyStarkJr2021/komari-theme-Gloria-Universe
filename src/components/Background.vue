<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const isLoaded = ref(false)
const hasError = ref(false)

const showBackground = computed(() => appStore.backgroundEnabled)
const currentUrl = computed(() => showBackground.value ? appStore.currentBackgroundUrl : '')
const backgroundType = computed(() => appStore.backgroundType)
const hasCustomBackground = computed(() => showBackground.value && !!currentUrl.value)
const showBackgroundOverlay = computed(() => appStore.backgroundOverlay > 0)

const backgroundStyle = computed(() => {
  const blur = appStore.backgroundBlur
  return {
    filter: blur > 0 ? `blur(${blur}px)` : 'none',
    opacity: appStore.backgroundType === 'video' && !isLoaded.value ? 0 : 1,
  }
})

const backgroundContainerStyle = computed(() => {
  const overlay = appStore.backgroundOverlay
  if (overlay >= 0)
    return {}

  return { opacity: 1 - Math.abs(overlay) / 100 }
})

const overlayStyle = computed(() => {
  const overlay = appStore.backgroundOverlay
  if (overlay <= 0)
    return {}

  return { backgroundColor: `rgba(0, 0, 0, ${overlay / 100})` }
})

const showLoadedBackground = computed(() =>
  hasCustomBackground.value && isLoaded.value && !hasError.value,
)

const showMediaBackground = computed(() =>
  hasCustomBackground.value && !hasError.value && (backgroundType.value === 'video' || showLoadedBackground.value),
)

const showDefaultBackground = computed(() =>
  !hasCustomBackground.value || !showMediaBackground.value || hasError.value,
)

const showLoadingBackground = computed(() =>
  hasCustomBackground.value && backgroundType.value === 'video' && !isLoaded.value && !hasError.value,
)

const showFallbackBackground = computed(() =>
  hasCustomBackground.value && backgroundType.value === 'video' && hasError.value,
)

let imageLoader: HTMLImageElement | null = null

function clearImageLoader() {
  if (imageLoader) {
    imageLoader.onload = null
    imageLoader.onerror = null
    imageLoader = null
  }
}

function loadImage(url: string) {
  isLoaded.value = false
  hasError.value = false

  clearImageLoader()

  imageLoader = new Image()
  imageLoader.onload = () => {
    isLoaded.value = true
    hasError.value = false
  }
  imageLoader.onerror = () => {
    isLoaded.value = false
    hasError.value = true
  }
  imageLoader.src = url
}

const videoRef = ref<HTMLVideoElement | null>(null)

function resetBackgroundState() {
  clearImageLoader()

  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.removeAttribute('src')
    videoRef.value.load()
  }

  isLoaded.value = false
  hasError.value = false
}

function handleVideoLoaded() {
  isLoaded.value = true
  hasError.value = false
}
function handleVideoError() {
  isLoaded.value = false
  hasError.value = true
}

watch([showBackground, currentUrl, backgroundType], ([enabled, url, type]) => {
  if (!enabled || !url) {
    resetBackgroundState()
    return
  }

  if (type === 'image') {
    loadImage(url)
  }
  else if (type === 'video') {
    clearImageLoader()
    isLoaded.value = false
    hasError.value = false
  }
}, { immediate: true })

onUnmounted(() => {
  resetBackgroundState()
})
</script>

<template>
  <div class="background-container" :style="backgroundContainerStyle">
    <div class="gloria-nebula" aria-hidden="true" />
    <div class="gloria-stars" aria-hidden="true" />
    <Transition name="fade">
      <div v-if="showDefaultBackground" class="default-background" />
    </Transition>
    <Transition name="fade">
      <div v-if="showLoadingBackground" class="background-loading" />
    </Transition>
    <Transition name="fade">
      <div v-if="showFallbackBackground" class="background-loading" />
    </Transition>
    <Transition name="fade">
      <div v-if="showMediaBackground" class="background-media" :style="backgroundStyle">
        <div
          v-if="backgroundType === 'image'"
          class="background-image"
          :style="{ backgroundImage: `url(${currentUrl})` }"
        />
        <video
          v-else-if="backgroundType === 'video'"
          ref="videoRef"
          class="background-video"
          :src="currentUrl ?? undefined"
          autoplay
          loop
          muted
          preload="auto"
          playsinline
          @loadeddata="handleVideoLoaded"
          @canplay="handleVideoLoaded"
          @error="handleVideoError"
        />
      </div>
    </Transition>
    <div v-if="showBackgroundOverlay" class="background-overlay" :style="overlayStyle" />
  </div>
</template>

<style scoped>
.background-container {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.default-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background-image: url('/images/starlight-background-v1.png');
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover;
  filter: saturate(1.14) contrast(1.02) brightness(1.01);
  transform: scale(1.01);
  transform-origin: center;
}

.dark .default-background {
  background-image: url('/images/default-background-v2.webp');
  filter: brightness(0.62) saturate(0.92) contrast(1.12);
}

.gloria-nebula,
.gloria-stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.gloria-nebula {
  z-index: 2;
  background:
    radial-gradient(circle at 82% 12%, rgb(167 139 250 / 0.14), transparent 34%),
    radial-gradient(circle at 8% 62%, rgb(34 211 238 / 0.11), transparent 32%),
    radial-gradient(circle at 64% 86%, rgb(244 114 182 / 0.1), transparent 32%),
    linear-gradient(135deg, rgb(255 255 255 / 0.08), rgb(233 213 255 / 0.1));
}

.dark .gloria-nebula {
  background:
    radial-gradient(circle at 82% 12%, rgb(155 92 255 / 0.18), transparent 32%),
    linear-gradient(135deg, rgb(5 8 22 / 0.1), rgb(36 19 74 / 0.18));
}

.gloria-stars {
  z-index: 3;
  opacity: 0.48;
  background-image:
    radial-gradient(circle at 18% 22%, #fff 0 1px, transparent 1.6px),
    radial-gradient(circle at 64% 35%, #57d6ff 0 1px, transparent 1.7px),
    radial-gradient(circle at 34% 78%, #ff7ac8 0 1px, transparent 1.6px),
    radial-gradient(circle at 88% 67%, #ffd77a 0 1px, transparent 1.5px);
  background-size:
    180px 190px,
    260px 230px,
    310px 290px,
    220px 270px;
  animation: gloria-star-drift 36s linear infinite;
}

.dark .gloria-stars {
  opacity: 0.32;
}

@keyframes gloria-star-drift {
  to {
    transform: translate3d(-24px, 18px, 0);
  }
}

@media (max-width: 768px) {
  .default-background {
    background-position: 68% center;
    transform: scale(1.02);
  }
}

@media (prefers-reduced-motion: reduce) {
  .gloria-stars {
    animation: none;
  }
}

.background-loading {
  position: absolute;
  inset: 0;
  background-color: rgb(15 23 42);
}

:root:not(.dark) .background-loading {
  background:
    radial-gradient(circle at 50% 0%, rgb(16 185 129 / 0.08), transparent 36%),
    linear-gradient(180deg, rgb(203 213 225), rgb(148 163 184));
}

.background-media {
  position: absolute;
  inset: 0;
  transition: opacity 0.8s ease;
}

.background-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.background-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.background-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
