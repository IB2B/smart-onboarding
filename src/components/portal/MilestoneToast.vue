<template>
  <Transition name="milestone-toast">
    <div
      v-if="visible"
      class="toast-shell"
      role="status"
      aria-live="polite"
    >
      <div class="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1c1c1e]/90 px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur-3xl">
        <!-- Icon -->
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/25 ring-1 ring-success/40">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-4 w-4 text-success">
            <path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd" />
          </svg>
        </div>
        <!-- Text -->
        <div class="min-w-0">
          <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45">Milestone reached</p>
          <p class="text-[13px] font-semibold text-white">{{ label }}</p>
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
    timer = setTimeout(() => { visible.value = false }, 3000)
  },
)
</script>

<style scoped>
/* Keep all transforms here — never mix with Tailwind translate utilities
   on the animated element, or the properties will override each other. */
.toast-shell {
  position: fixed;
  top: 1rem;
  left: 50%;
  z-index: 9998;
  /* base resting state — translateX always present so animation never loses it */
  transform: translateX(-50%) translateY(0);
}

.milestone-toast-enter-active {
  transition: opacity 480ms ease-out, transform 480ms cubic-bezier(0.16, 1, 0.3, 1);
}
.milestone-toast-leave-active {
  transition: opacity 350ms ease-in, transform 350ms ease-in;
}
.milestone-toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-110%);
}
.milestone-toast-enter-to {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.milestone-toast-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.milestone-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-14px);
}
</style>
