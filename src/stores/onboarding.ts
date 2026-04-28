import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { MilestoneKey, MilestoneMap, OnboardingPhase, OnboardingSnapshotDelta, OnboardingState } from '@/contracts/api'

export const useOnboardingStore = defineStore('onboarding', () => {
  const onboardingState = ref<OnboardingState | null>(null)
  const lastCompletedMilestone = ref<MilestoneKey | null>(null)
  const milestoneCompletedAt = ref<number>(0)

  function setState(state: OnboardingState | null) {
    onboardingState.value = state
  }

  function applySnapshotDelta(delta: Partial<OnboardingSnapshotDelta>): MilestoneKey[] {
    if (!delta.phase && !delta.milestones) return []
    if (!onboardingState.value) return []

    const prev = onboardingState.value.milestones
    const nextMilestones: MilestoneMap = delta.milestones
      ? { ...prev, ...delta.milestones }
      : prev

    const newlyComplete: MilestoneKey[] = []
    if (delta.milestones) {
      for (const key of Object.keys(delta.milestones) as MilestoneKey[]) {
        if (prev[key]?.status !== 'complete' && nextMilestones[key]?.status === 'complete') {
          newlyComplete.push(key)
        }
      }
    }

    onboardingState.value = {
      ...onboardingState.value,
      ...(delta.phase ? { phase: delta.phase as OnboardingPhase } : {}),
      milestones: nextMilestones,
    }

    if (newlyComplete.length > 0) {
      lastCompletedMilestone.value = newlyComplete.at(-1)!
      milestoneCompletedAt.value = Date.now()
    }

    return newlyComplete
  }

  const isPostOnboarding = computed(
    () => onboardingState.value?.phase === 'review' || onboardingState.value?.phase === 'complete',
  )

  const completedCount = computed(
    () => Object.values(onboardingState.value?.milestones ?? {}).filter((m) => m.status === 'complete').length,
  )

  return {
    onboardingState,
    lastCompletedMilestone,
    milestoneCompletedAt,
    isPostOnboarding,
    completedCount,
    setState,
    applySnapshotDelta,
  }
})
