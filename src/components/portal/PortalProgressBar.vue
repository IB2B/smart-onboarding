<template>
  <div class="hidden sm:flex items-center gap-3">
    <!-- Stages -->
    <div class="flex items-center gap-0">
      <template v-for="(stage, index) in STAGES" :key="stage.key">
        <!-- Connecting line (not before first stage) -->
        <div
          v-if="index > 0"
          class="h-px w-6 transition-colors duration-300"
          :class="isComplete(STAGES[index - 1]!.key) ? 'bg-emerald-400' : 'bg-slate-200'"
        />

        <!-- Stage indicator -->
        <div class="flex flex-col items-center gap-0.5">
          <div
            class="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-300"
            :class="stageClass(stage.key, index)"
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
            class="text-[9px] font-medium tracking-tight transition-colors duration-300"
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
import { computed } from 'vue'
import type { MilestoneKey, OnboardingState } from '@/contracts/api'

const props = defineProps<{
  onboardingState: OnboardingState | null
}>()

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
  if (isComplete(key)) return 'bg-emerald-500 text-white'
  if (isCurrent(key)) return 'ring-2 ring-blue-500 bg-white text-blue-600'
  // First incomplete that is not current gets subtle highlight if it's next up
  const completedCount = STAGES.filter((s) => isComplete(s.key)).length
  if (index === completedCount && !isCurrent(key)) return 'ring-2 ring-blue-400/50 bg-white text-blue-400'
  return 'bg-slate-200 text-slate-400'
}

function labelClass(key: MilestoneKey): string {
  if (isComplete(key)) return 'text-emerald-600'
  if (isCurrent(key)) return 'text-blue-600'
  return 'text-slate-400'
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
  if (phase === 'complete') return 'bg-emerald-50 text-emerald-700'
  if (phase === 'review') return 'bg-amber-50 text-amber-700'
  if (completedCount.value === 0) return 'bg-slate-100 text-slate-500'
  return 'bg-blue-50 text-blue-600'
})
</script>
