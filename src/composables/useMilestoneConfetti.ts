import confetti from 'canvas-confetti'
import { watch } from 'vue'
import { useOnboardingStore } from '@/stores/onboarding'

export function useMilestoneConfetti() {
  const store = useOnboardingStore()
  watch(
    () => store.milestoneCompletedAt,
    (t) => {
      if (!t) return
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.4 }, zIndex: 9999 })
    },
  )
}
