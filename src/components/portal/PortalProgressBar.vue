<template>
  <div class="flex items-center gap-3">
    <!-- Stages -->
    <div class="flex items-center gap-0">
      <template v-for="(stage, index) in STAGES" :key="stage.key">
        <!-- Connecting line (not before first stage) -->
        <div
          v-if="index > 0"
          class="h-px w-3 sm:w-6 transition-colors duration-300"
          :class="isComplete(STAGES[index - 1]!.key) ? 'bg-success' : 'bg-base-300'"
        />

        <!-- Stage indicator -->
        <div class="flex flex-col items-center gap-0.5">
          <div
            class="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-300"
            :class="[stageClass(stage.key, index), { 'milestone-pop': justCompleted === stage.key }]"
          >
            <svg
              v-if="isComplete(stage.key)"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              class="h-3 w-3"
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
            class="hidden sm:block text-[9px] font-medium tracking-tight transition-colors duration-300"
            :class="labelClass(stage.key)"
          >
            {{ stage.label }}
          </span>
        </div>
      </template>
    </div>

    <!-- Status badge -->
    <span
      class="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none transition-colors duration-300"
      :class="statusBadgeClass"
    >
      {{ statusLabel }}
    </span>
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
  const phase = props.onboardingState.phase
  return phase === key
}

function stageClass(key: MilestoneKey, index: number): string {
  if (isComplete(key)) return 'bg-success text-success-content'
  if (isCurrent(key)) return 'ring-2 ring-primary bg-base-100 text-primary'
  // First incomplete that is not current gets subtle highlight if it's next up
  const completedCount = STAGES.filter((s) => isComplete(s.key)).length
  if (index === completedCount && !isCurrent(key)) return 'ring-2 ring-primary/50 bg-base-100 text-primary/50'
  return 'bg-base-200 text-base-content/40'
}

function labelClass(key: MilestoneKey): string {
  if (isComplete(key)) return 'text-success'
  if (isCurrent(key)) return 'text-primary'
  return 'text-base-content/40'
}

const completedCount = computed(() => STAGES.filter((s) => isComplete(s.key)).length)

const statusLabel = computed((): string => {
  const phase = props.onboardingState?.phase
  if (phase === 'complete') return 'Completed'
  if (phase === 'review') return 'In Review'
  if (completedCount.value === 0) return 'Not Started'
  return 'In Progress'
})

const statusBadgeClass = computed((): string => {
  const phase = props.onboardingState?.phase
  if (phase === 'complete') return 'bg-success/10 text-success'
  if (phase === 'review') return 'bg-warning/10 text-warning'
  if (completedCount.value === 0) return 'bg-base-200 text-base-content/50'
  return 'bg-primary/10 text-primary'
})
</script>
