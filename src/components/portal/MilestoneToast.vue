<template>
  <Transition name="milestone-toast">
    <div
      v-if="visible"
      class="fixed left-1/2 top-5 z-[9998] -translate-x-1/2 rounded-full border border-success/30 bg-success/10 px-5 py-2.5 text-sm font-semibold text-success shadow-lg backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      {{ label }} complete ✓
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useOnboardingStore } from '@/stores/onboarding'
import type { MilestoneKey } from '@/contracts/api'

const LABELS: Record<MilestoneKey, string> = {
  brand_identity: 'Brand Identity',
  technical_needs: 'Technical Needs',
  target_audience: 'Target Audience',
  timeline_budget: 'Timeline & Budget',
}

const store = useOnboardingStore()
const visible = ref(false)
const label = ref('')
let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => store.milestoneCompletedAt,
  () => {
    if (!store.lastCompletedMilestone) return
    label.value = LABELS[store.lastCompletedMilestone] ?? store.lastCompletedMilestone
    visible.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { visible.value = false }, 2500)
  },
)
</script>

<style scoped>
.milestone-toast-enter-active { transition: opacity 200ms ease, transform 200ms ease; }
.milestone-toast-leave-active { transition: opacity 300ms ease, transform 300ms ease; }
.milestone-toast-enter-from,
.milestone-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }
.milestone-toast-enter-to,
.milestone-toast-leave-from { opacity: 1; transform: translateX(-50%) translateY(0); }
</style>
