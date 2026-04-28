<template>
  <Transition name="milestone-toast">
    <div
      v-if="visible"
      class="fixed left-1/2 top-4 z-[9998] -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div class="flex items-center gap-3 rounded-2xl border border-base-300/60 bg-base-100/90 px-4 py-3 shadow-2xl shadow-black/10 backdrop-blur-xl">
        <!-- Icon -->
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15 ring-1 ring-success/30">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-4 w-4 text-success">
            <path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd" />
          </svg>
        </div>
        <!-- Text -->
        <div class="min-w-0">
          <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-base-content/40">Milestone reached</p>
          <p class="text-sm font-semibold text-base-content">{{ label }}</p>
        </div>
      </div>
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
    timer = setTimeout(() => { visible.value = false }, 2800)
  },
)
</script>

<style scoped>
.milestone-toast-enter-active { transition: opacity 220ms ease, transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1); }
.milestone-toast-leave-active { transition: opacity 280ms ease, transform 280ms ease; }
.milestone-toast-enter-from,
.milestone-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.95); }
.milestone-toast-enter-to,
.milestone-toast-leave-from { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
</style>
