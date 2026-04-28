<template>
  <div class="rounded-2xl border border-base-300/60 bg-base-100/60 backdrop-blur-sm overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 pt-4 pb-3">
      <span class="text-[11px] font-bold uppercase tracking-[0.08em] text-base-content/40">Your Progress</span>
      <span class="text-[13px] font-bold" :class="counterColor">
        {{ completedCount }}<span class="font-medium text-base-content/30">/4</span>
      </span>
    </div>

    <!-- Progress track -->
    <div class="mx-4 mb-4 h-[3px] overflow-hidden rounded-full bg-base-300/60">
      <div
        class="h-full rounded-full transition-all duration-700 ease-out"
        :class="progressBarColor"
        :style="{ width: `${(completedCount / 4) * 100}%` }"
      />
    </div>

    <!-- Milestone rows -->
    <div class="pb-3">
      <div
        v-for="(stage, index) in STAGES"
        :key="stage.key"
        class="relative flex items-center gap-3 px-4 py-[9px] transition-colors duration-200"
        :class="rowClass(stage.key)"
      >
        <!-- Vertical connector line -->
        <div
          v-if="index < STAGES.length - 1"
          class="absolute left-[27px] top-[calc(50%+11px)] h-[calc(100%-2px)] w-px"
          :class="isComplete(STAGES[index]!.key) ? 'bg-success/40' : 'bg-base-300/50'"
        />

        <!-- Status circle -->
        <div
          class="relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300"
          :class="[circleClass(stage.key, index), { 'milestone-pop': justCompleted === stage.key }]"
        >
          <svg
            v-if="isComplete(stage.key)"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="h-3 w-3"
          >
            <path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd" />
          </svg>
          <span v-else>{{ index + 1 }}</span>
        </div>

        <!-- Label -->
        <span
          class="text-[13px] font-medium leading-tight transition-colors duration-200"
          :class="labelClass(stage.key)"
        >
          {{ stage.label }}
        </span>

        <!-- Active pulse dot -->
        <div v-if="isCurrent(stage.key) && !isComplete(stage.key)" class="ml-auto">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        </div>
      </div>
    </div>

    <!-- Status footer -->
    <div
      class="border-t border-base-300/50 px-4 py-2.5"
      :class="footerBgClass"
    >
      <span class="text-[11px] font-semibold" :class="footerTextClass">{{ statusLabel }}</span>
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
  { key: 'brand_identity', label: 'Brand Identity' },
  { key: 'technical_needs', label: 'Technical Needs' },
  { key: 'target_audience', label: 'Target Audience' },
  { key: 'timeline_budget', label: 'Timeline & Budget' },
]

function isComplete(key: MilestoneKey): boolean {
  return props.onboardingState?.milestones[key]?.status === 'complete'
}

function isCurrent(key: MilestoneKey): boolean {
  return props.onboardingState?.phase === key
}

const completedCount = computed(() => STAGES.filter((s) => isComplete(s.key)).length)

function rowClass(key: MilestoneKey): string {
  if (isCurrent(key) && !isComplete(key)) return 'bg-primary/5'
  return ''
}

function circleClass(key: MilestoneKey, index: number): string {
  if (isComplete(key)) return 'bg-success text-success-content shadow-sm shadow-success/30'
  if (isCurrent(key)) return 'bg-primary text-primary-content ring-[3px] ring-primary/20'
  const completedIdx = STAGES.filter((s) => isComplete(s.key)).length
  if (index === completedIdx) return 'border-2 border-primary/30 bg-base-100 text-primary/50'
  return 'border border-base-300 bg-base-200 text-base-content/30'
}

function labelClass(key: MilestoneKey): string {
  if (isComplete(key)) return 'text-base-content/50 line-through decoration-base-content/25'
  if (isCurrent(key)) return 'text-base-content font-semibold'
  return 'text-base-content/45'
}

const counterColor = computed(() => {
  const phase = props.onboardingState?.phase
  if (phase === 'complete') return 'text-success'
  if (completedCount.value > 0) return 'text-primary'
  return 'text-base-content/40'
})

const progressBarColor = computed(() => {
  if (completedCount.value === 4) return 'bg-success'
  return 'bg-primary'
})

const statusLabel = computed(() => {
  const phase = props.onboardingState?.phase
  if (phase === 'complete') return '✓ Onboarding complete'
  if (phase === 'review') return '⏳ Under review'
  if (completedCount.value === 0) return 'Not started yet'
  return `${completedCount.value} of 4 milestones done`
})

const footerBgClass = computed(() => {
  const phase = props.onboardingState?.phase
  if (phase === 'complete') return 'bg-success/5'
  if (phase === 'review') return 'bg-warning/5'
  if (completedCount.value > 0) return 'bg-primary/5'
  return ''
})

const footerTextClass = computed(() => {
  const phase = props.onboardingState?.phase
  if (phase === 'complete') return 'text-success'
  if (phase === 'review') return 'text-warning'
  if (completedCount.value > 0) return 'text-primary/70'
  return 'text-base-content/35'
})
</script>
