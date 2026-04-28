<template>
  <div class="flex items-center gap-2">
    <template v-for="(stage, index) in STAGES" :key="stage.key">

      <!-- Connecting track (not before first stage) -->
      <div v-if="index > 0" class="h-[3px] w-6 sm:w-10 overflow-hidden rounded-full bg-base-300">
        <div
          class="h-full rounded-full bg-success transition-all duration-500"
          :style="{ width: isComplete(STAGES[index - 1]!.key) ? '100%' : '0%' }"
        />
      </div>

      <!-- Stage node + label -->
      <div class="flex flex-col items-center gap-[5px]">
        <div
          class="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300"
          :class="[nodeClass(stage.key, index), { 'milestone-pop': justCompleted === stage.key }]"
        >
          <svg
            v-if="isComplete(stage.key)"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="h-3.5 w-3.5"
          >
            <path
              fill-rule="evenodd"
              d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
              clip-rule="evenodd"
            />
          </svg>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <span
          class="text-[9px] font-semibold tracking-wide transition-colors duration-300"
          :class="labelClass(stage.key)"
        >
          {{ stage.label }}
        </span>
      </div>

    </template>

    <!-- Progress counter + status -->
    <div class="ml-2 flex flex-col items-start gap-0.5">
      <span class="text-[11px] font-bold leading-none" :class="counterClass">
        {{ completedCount }}<span class="font-medium text-base-content/30">/4</span>
      </span>
      <span
        class="text-[9px] font-semibold uppercase tracking-[0.06em] transition-colors duration-300"
        :class="statusTextClass"
      >
        {{ statusLabel }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { MilestoneKey, OnboardingState } from '@/contracts/api'

const props = defineProps<{
  onboardingState: OnboardingState | null
}>()

const justCompleted = ref<MilestoneKey | null>(null)
let popTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.onboardingState?.milestones,
  (next, prev) => {
    if (!next || !prev) return
    for (const key of Object.keys(next) as MilestoneKey[]) {
      if (prev[key]?.status !== 'complete' && next[key]?.status === 'complete') {
        justCompleted.value = key
        if (popTimer) clearTimeout(popTimer)
        popTimer = setTimeout(() => { justCompleted.value = null }, 900)
      }
    }
  },
  { deep: true },
)

const STAGES: Array<{ key: MilestoneKey; label: string }> = [
  { key: 'brand_identity', label: 'Brand' },
  { key: 'technical_needs', label: 'Tech' },
  { key: 'target_audience', label: 'Audience' },
  { key: 'timeline_budget', label: 'Timeline' },
]

function isComplete(key: MilestoneKey): boolean {
  return props.onboardingState?.milestones[key]?.status === 'complete'
}

function isCurrent(key: MilestoneKey): boolean {
  if (!props.onboardingState) return false
  return props.onboardingState.phase === key
}

function nodeClass(key: MilestoneKey, index: number): string {
  if (isComplete(key)) {
    return 'bg-success text-success-content shadow-sm shadow-success/40'
  }
  if (isCurrent(key)) {
    return 'bg-primary text-primary-content ring-4 ring-primary/20 shadow-sm shadow-primary/30'
  }
  const completedCount = STAGES.filter((s) => isComplete(s.key)).length
  if (index === completedCount) {
    return 'bg-base-100 text-primary/70 ring-2 ring-primary/25 border border-primary/15'
  }
  return 'bg-base-200 text-base-content/30 border border-base-300'
}

function labelClass(key: MilestoneKey): string {
  if (isComplete(key)) return 'text-success'
  if (isCurrent(key)) return 'text-primary'
  return 'text-base-content/35'
}

const completedCount = computed(() => STAGES.filter((s) => isComplete(s.key)).length)

const statusLabel = computed((): string => {
  const phase = props.onboardingState?.phase
  if (phase === 'complete') return 'Done'
  if (phase === 'review') return 'Review'
  if (completedCount.value === 0) return 'Not started'
  return 'In progress'
})

const counterClass = computed((): string => {
  const phase = props.onboardingState?.phase
  if (phase === 'complete') return 'text-success'
  if (completedCount.value > 0) return 'text-primary'
  return 'text-base-content/40'
})

const statusTextClass = computed((): string => {
  const phase = props.onboardingState?.phase
  if (phase === 'complete') return 'text-success'
  if (phase === 'review') return 'text-warning'
  if (completedCount.value > 0) return 'text-primary/60'
  return 'text-base-content/30'
})
</script>
