import { ref } from 'vue'
import { defineStore } from 'pinia'

import type { SpecDecision } from '@/contracts/api'

const fixedDecision: SpecDecision = {
  themeId: 'aura-frost',
  fontPairId: 'jakarta-inter',
  iconPackId: 'phosphor',
  density: 'balanced',
  approvedAt: '2026-04-03T00:00:00.000Z',
}

export const useSpecLabStore = defineStore('spec-lab', () => {
  const decision = ref<SpecDecision>({ ...fixedDecision })
  return { decision }
})
