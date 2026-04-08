<template>
  <div class="space-y-4">
    <!-- Section 1: Info cards grid -->
    <div class="grid gap-2 sm:grid-cols-2">
      <div class="rounded-xl border border-base-300/80 bg-base-200/45 p-2.5">
        <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-base-content/40">Company</p>
        <p class="mt-1 text-sm font-medium">{{ client.company }}</p>
      </div>
      <div class="rounded-xl border border-base-300/80 bg-base-200/45 p-2.5">
        <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-base-content/40">Contact</p>
        <p class="mt-1 text-sm font-medium">{{ client.contactName }}</p>
        <p class="text-xs text-base-content/55">{{ client.email }}</p>
      </div>
      <div class="rounded-xl border border-base-300/80 bg-base-200/45 p-2.5">
        <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-base-content/40">Phase</p>
        <p class="mt-1 text-sm font-medium capitalize">{{ phaseLabel }}</p>
      </div>
      <div class="rounded-xl border border-base-300/80 bg-base-200/45 p-2.5">
        <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-base-content/40">Onboarding Status</p>
        <p class="mt-1 text-sm font-medium capitalize">{{ onboardingState?.status ?? 'unknown' }}</p>
      </div>
    </div>

    <!-- Section 2: Milestones -->
    <div v-if="onboardingState?.milestones">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-base-content/40">Milestones</p>
      <ul class="space-y-1.5">
        <li
          v-for="key in MILESTONE_KEYS"
          :key="key"
          class="flex items-center justify-between gap-2"
        >
          <span class="text-sm capitalize">{{ key.replaceAll('_', ' ') }}</span>
          <span
            class="rounded-full px-2 py-0.5 text-[11px] font-medium"
            :class="milestoneBadgeClass(onboardingState.milestones[key]?.status)"
          >
            {{ onboardingState.milestones[key]?.status ?? 'pending' }}
          </span>
        </li>
      </ul>
    </div>

    <!-- Section 3: Collected Data -->
    <div v-if="hasCollectedData">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-base-content/40">Collected Data</p>
      <ul class="space-y-1.5">
        <li
          v-for="(value, key) in onboardingState!.collectedData"
          :key="key"
          class="rounded-xl border border-base-300/80 bg-base-200/45 p-2.5"
        >
          <p class="text-[11px] font-medium uppercase tracking-[0.14em] text-base-content/40">
            {{ String(key).replaceAll('_', ' ') }}
          </p>
          <p class="mt-1 text-sm">{{ value }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ClientSummary, MilestoneKey, MilestoneStatus, OnboardingState } from '@/contracts/api'

const MILESTONE_KEYS = [
  'brand_identity',
  'technical_needs',
  'target_audience',
  'timeline_budget',
] as const satisfies readonly MilestoneKey[]

const props = defineProps<{
  client: ClientSummary
  onboardingState: OnboardingState | null
}>()

const phaseLabel = computed(() =>
  props.onboardingState?.phase?.replaceAll('_', ' ') ?? 'unknown',
)

const hasCollectedData = computed(
  () =>
    props.onboardingState != null &&
    Object.keys(props.onboardingState.collectedData).length > 0,
)

function milestoneBadgeClass(status: MilestoneStatus | undefined): string {
  if (status === 'complete') return 'bg-success/20 text-success-content'
  if (status === 'in_progress') return 'bg-warning/25 text-warning-content'
  return 'bg-base-300/80 text-base-content/60'
}
</script>
