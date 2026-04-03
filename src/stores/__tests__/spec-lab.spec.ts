import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useSpecLabStore } from '@/stores/spec-lab'

describe('spec-lab store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns fixed approved theme decision', () => {
    const store = useSpecLabStore()
    expect(store.decision.themeId).toBe('aura-frost')
    expect(store.decision.fontPairId).toBe('jakarta-inter')
    expect(store.decision.iconPackId).toBe('phosphor')
    expect(store.decision.density).toBe('balanced')
    expect(store.decision.approvedAt).toBeTruthy()
  })
})
