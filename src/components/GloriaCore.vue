<script setup lang="ts">
import type { NodeData } from '@/stores/nodes'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import GloriaWorldMap from '@/components/GloriaWorldMap.vue'
import { useAppStore } from '@/stores/app'

const props = defineProps<{ nodes?: NodeData[] }>()
const appStore = useAppStore()
const easterActive = ref(false)
let easterTimer: ReturnType<typeof setTimeout> | null = null
const easterSource = computed(() => appStore.gloriaHeroUrl || '/images/gloria/iag-2-wedding-original.jpg')
const easterType = computed(() => appStore.gloriaHeroUrl ? appStore.gloriaHeroType : 'image')

function revealEasterEgg(): void {
  easterActive.value = false
  requestAnimationFrame(() => easterActive.value = true)
  if (easterTimer)
    clearTimeout(easterTimer)
  easterTimer = setTimeout(() => easterActive.value = false, 6200)
}

onMounted(() => window.addEventListener('gloria:easter-egg', revealEasterEgg))
onBeforeUnmount(() => {
  window.removeEventListener('gloria:easter-egg', revealEasterEgg)
  if (easterTimer)
    clearTimeout(easterTimer)
})
</script>

<template>
  <section class="gloria-stage" aria-label="GLORIA UNIVERSE 星网节点地图">
    <GloriaWorldMap :nodes="props.nodes" :paused="appStore.stopEarth" />
    <button type="button" class="gloria-stage__egg" title="点击唤醒 GLORIA UNIVERSE 彩蛋" aria-label="唤醒 GLORIA UNIVERSE 彩蛋" @click="revealEasterEgg">
      <span>◇</span><small>WAKE GLORIA</small>
    </button>

    <Teleport to="body">
      <Transition name="gloria-awakening">
        <button v-if="easterActive" type="button" class="gloria-easter" aria-label="关闭 GLORIA UNIVERSE 彩蛋" @click="easterActive = false">
          <video v-if="easterType === 'video'" class="gloria-easter__backdrop" :src="easterSource" poster="/images/gloria/iag-2-wedding-original.jpg" autoplay muted loop playsinline />
          <img v-else class="gloria-easter__backdrop" :src="easterSource" alt="G.E.M. 邓紫棋 I AM GLORIA 2.0 婚纱舞台造型">
          <span class="gloria-easter__veil" aria-hidden="true" />
          <span v-for="index in 18" :key="index" class="gloria-easter__star" :style="{ '--star-index': index }" aria-hidden="true">✦</span>
          <span class="gloria-easter__content">
            <span class="gloria-easter__gem" aria-hidden="true">◇</span>
            <small>WELCOME TO GLORIA UNIVERSE</small>
            <strong>如果神让你看见</strong>
            <em>I AM GLORIA</em>
          </span>
        </button>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.gloria-stage {
  position: relative;
  isolation: isolate;
  min-height: 16.5rem;
  overflow: hidden;
  border: 1px solid rgb(155 92 255 / 0.24);
  border-radius: 1.1rem;
  background: #030512;
  box-shadow:
    inset 0 1px rgb(255 255 255 / 0.06),
    0 18px 48px rgb(0 0 0 / 0.24);
}

:global(:root:not(.dark) .gloria-stage) {
  border-color: rgb(255 255 255 / 0.88);
  background: rgb(255 255 255 / 0.76);
  box-shadow:
    inset 0 1px rgb(255 255 255 / 0.94),
    0 16px 40px rgb(91 33 182 / 0.14),
    0 5px 20px rgb(14 165 233 / 0.08);
}
.gloria-stage__egg {
  position: absolute;
  z-index: 6;
  top: 0.72rem;
  right: 0.78rem;
  display: grid;
  min-width: 4.25rem;
  place-items: center;
  border: 1px solid rgb(253 230 138 / 0.42);
  border-radius: 999px;
  background: rgb(5 8 22 / 0.72);
  padding: 0.32rem 0.52rem;
  color: #fde68a;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 18px rgb(244 114 182 / 0.18);
  isolation: isolate;
  transition:
    border-color 180ms ease,
    transform 180ms ease,
    background 180ms ease;
}
.gloria-stage__egg::before {
  position: absolute;
  z-index: -1;
  inset: -0.18rem;
  border: 1px solid rgb(253 230 138 / 0.64);
  border-radius: inherit;
  content: '';
  pointer-events: none;
  animation: gloria-egg-signal 2.8s ease-out infinite;
}
.gloria-stage__egg::after {
  position: absolute;
  top: -0.2rem;
  right: 0.22rem;
  color: #fff5bd;
  content: '✦';
  font-size: 0.48rem;
  pointer-events: none;
  text-shadow:
    0 0 9px #fde68a,
    0 0 16px #f472b6;
  animation: gloria-egg-spark 3.4s ease-in-out infinite;
}
.gloria-stage__egg:hover {
  border-color: rgb(253 230 138 / 0.9);
  background: rgb(24 18 54 / 0.86);
  transform: translateY(-1px) scale(1.04);
}
.gloria-stage__egg span {
  font-size: 0.95rem;
  line-height: 0.8;
  text-shadow: 0 0 12px currentColor;
  animation: gloria-egg-beacon 2.8s ease-in-out infinite;
}
.gloria-stage__egg small {
  margin-top: 0.14rem;
  font-family: var(--font-display);
  font-size: 0.4rem;
  letter-spacing: 0.08em;
}

.gloria-easter {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  overflow: hidden;
  place-items: center;
  border: 0;
  background: #02030d;
  color: white;
  cursor: pointer;
}
.gloria-easter__backdrop,
.gloria-easter__veil {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.gloria-easter__backdrop {
  object-fit: cover;
  object-position: center 42%;
  opacity: 0.43;
  animation: gloria-easter-camera 6.2s ease-out both;
}
.gloria-easter__veil {
  background:
    radial-gradient(circle at 50% 48%, transparent 4%, rgb(6 5 25 / 0.1) 38%, rgb(2 3 13 / 0.82) 100%),
    linear-gradient(0deg, rgb(2 3 13 / 0.76), transparent 44%, rgb(2 3 13 / 0.32));
}
.gloria-easter__content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 1.5rem;
  text-align: center;
  text-shadow:
    0 3px 24px #02030d,
    0 0 34px #02030d;
}
.gloria-easter__gem {
  color: #fde68a;
  font-size: clamp(3.4rem, 9vw, 7rem);
  line-height: 0.75;
  text-shadow:
    0 0 18px #fde68a,
    0 0 54px #f472b6,
    0 0 96px #8b5cf6;
  animation: gloria-gem-awaken 2.4s ease-in-out infinite;
}
.gloria-easter__content small {
  margin-top: 1rem;
  color: #9be9ff;
  font-family: var(--font-display);
  font-size: clamp(0.62rem, 1.5vw, 0.92rem);
  letter-spacing: 0.22em;
}
.gloria-easter__content strong {
  margin-top: 0.75rem;
  color: #fff7d6;
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 7vw, 5.8rem);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-shadow:
    0 4px 26px #02030d,
    0 0 26px rgb(253 230 138 / 0.66),
    0 0 64px rgb(139 92 246 / 0.74);
}
.gloria-easter__content em {
  margin-top: 0.55rem;
  color: rgb(253 230 138 / 0.86);
  font-family: var(--font-display);
  font-size: clamp(0.62rem, 1.7vw, 1rem);
  font-style: normal;
  letter-spacing: 0.32em;
}
.gloria-easter__star {
  --angle: calc(var(--star-index) * 20deg);
  position: absolute;
  z-index: 1;
  left: 50%;
  top: 50%;
  color: hsl(calc(205 + var(--star-index) * 5) 95% 78%);
  font-size: calc(0.45rem + var(--star-index) * 0.025rem);
  animation: gloria-star-burst 2.8s calc(var(--star-index) * -75ms) ease-out infinite;
}
.gloria-awakening-enter-active,
.gloria-awakening-leave-active {
  transition: opacity 380ms ease;
}
.gloria-awakening-enter-from,
.gloria-awakening-leave-to {
  opacity: 0;
}
@keyframes gloria-easter-camera {
  from {
    transform: scale(1.03);
  }
  to {
    transform: scale(1.11);
  }
}
@keyframes gloria-egg-beacon {
  0%,
  100% {
    transform: scale(0.92);
    color: #f5dc80;
    text-shadow: 0 0 7px rgb(253 230 138 / 0.56);
  }
  50% {
    transform: scale(1.13);
    color: #fff9d8;
    text-shadow:
      0 0 9px #fde68a,
      0 0 22px #f472b6,
      0 0 34px #8b5cf6;
  }
}
@keyframes gloria-egg-signal {
  0% {
    opacity: 0.72;
    transform: scale(0.94);
  }
  72%,
  100% {
    opacity: 0;
    transform: scale(1.16, 1.34);
  }
}
@keyframes gloria-egg-spark {
  0%,
  34%,
  100% {
    opacity: 0.16;
    transform: translateY(1px) scale(0.72) rotate(0deg);
  }
  48% {
    opacity: 1;
    transform: translateY(-2px) scale(1.16) rotate(22deg);
  }
  62% {
    opacity: 0.34;
    transform: translateY(-4px) scale(0.84) rotate(42deg);
  }
}
@keyframes gloria-gem-awaken {
  0%,
  100% {
    transform: scale(0.9) rotate(-4deg);
    opacity: 0.78;
  }
  50% {
    transform: scale(1.08) rotate(4deg);
    opacity: 1;
  }
}
@keyframes gloria-star-burst {
  0% {
    transform: rotate(var(--angle)) translateX(1rem) scale(0);
    opacity: 0;
  }
  26% {
    opacity: 1;
  }
  100% {
    transform: rotate(var(--angle)) translateX(42vmin) scale(1.3);
    opacity: 0;
  }
}
@media (max-width: 767px) {
  .gloria-stage {
    min-height: 16.5rem;
  }
  .gloria-stage__egg {
    top: 0.62rem;
    right: 0.62rem;
  }
  .gloria-easter__backdrop {
    object-position: 50% 46%;
    opacity: 0.38;
  }
  .gloria-easter__content strong {
    letter-spacing: 0.07em;
  }
}
@media (prefers-reduced-motion: reduce) {
  .gloria-stage__egg::before,
  .gloria-stage__egg::after,
  .gloria-stage__egg span,
  .gloria-easter__backdrop,
  .gloria-easter__gem,
  .gloria-easter__star {
    animation: none;
  }
}
</style>
