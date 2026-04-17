<template>
  <div
    class="flex items-center gap-[10px] rounded-[10px] border border-white/20 bg-white/10 px-[12px] py-[9px]"
    :style="{ minWidth: '200px', maxWidth: '280px' }"
  >
    <!-- Play / Pause button -->
    <button
      v-if="props.previewUrl"
      type="button"
      class="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      :aria-label="isPlaying ? 'Pause' : 'Play'"
      @click="togglePlay"
    >
      <PhPause v-if="isPlaying" :size="14" weight="fill" />
      <PhPlay v-else :size="14" weight="fill" />
    </button>

    <!-- Static icon when no URL (historical messages) -->
    <div
      v-else
      class="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-white/20"
    >
      <PhWaveform :size="15" weight="regular" />
    </div>

    <!-- Progress + duration -->
    <div class="flex min-w-0 flex-1 flex-col gap-[5px]">
      <div
        class="relative h-[3px] w-full overflow-hidden rounded-full bg-white/25"
        role="progressbar"
        :aria-valuenow="Math.round(progressPct)"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="absolute inset-y-0 left-0 rounded-full bg-white/80"
          :style="{ width: `${progressPct}%`, transition: reducedMotion ? 'none' : 'width 0.1s linear' }"
        />
      </div>
      <div class="flex items-center justify-between text-[11px] opacity-70">
        <span>{{ fmtSec(currentSec) }}</span>
        <span>{{ fmtSec(totalSec) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { PhPause, PhPlay, PhWaveform } from '@phosphor-icons/vue'

const props = defineProps<{
  previewUrl?: string
  durationSec?: number
  transcript?: string
}>()

const isPlaying = ref(false)
const currentSec = ref(0)
const audio = ref<HTMLAudioElement | null>(null)

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const totalSec = computed(() => {
  if (audio.value?.duration && isFinite(audio.value.duration)) return audio.value.duration
  return props.durationSec ?? 0
})

const progressPct = computed(() =>
  totalSec.value > 0 ? (currentSec.value / totalSec.value) * 100 : 0,
)

function fmtSec(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function buildAudio() {
  if (!props.previewUrl) return
  const el = new Audio(props.previewUrl)
  el.addEventListener('timeupdate', () => { currentSec.value = el.currentTime })
  el.addEventListener('ended', () => { isPlaying.value = false; currentSec.value = 0 })
  audio.value = el
}

function togglePlay() {
  if (!audio.value) buildAudio()
  const el = audio.value
  if (!el) return
  if (isPlaying.value) {
    el.pause()
    isPlaying.value = false
  } else {
    el.play().then(() => { isPlaying.value = true }).catch(() => {})
  }
}

watch(() => props.previewUrl, (url) => {
  if (audio.value) {
    audio.value.pause()
    audio.value = null
    isPlaying.value = false
    currentSec.value = 0
  }
  if (url) buildAudio()
}, { immediate: false })

onUnmounted(() => {
  audio.value?.pause()
  audio.value = null
})
</script>
