<template>
  <div :aria-label="props.brandName">
    <Transition name="fade" mode="out-in">
      <span
        v-if="!collapsed"
        key="full"
        class="aura-brand-name select-none"
      >
        {{ props.brandName }}
      </span>
      <span
        v-else
        key="initial"
        class="aura-brand-initial select-none"
        aria-hidden="true"
      >
        {{ compactLabel }}
      </span>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSidebarState } from '@/composables/useSidebarCollapse'

const props = withDefaults(
  defineProps<{
    brandName?: string
  }>(),
  {
    brandName: 'IntelligentB2B',
  },
)

const { collapsed } = useSidebarState()
const compactLabel = computed(() => 'IB')
</script>

<style scoped>
.aura-brand-name {
  display: block;
  text-align: center;
  font-family: var(--font-accent-serif);
  font-style: italic;
  font-size: 1.75rem;
  font-weight: 400;
  line-height: 1.1;
  color: #0a0a0a;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.aura-brand-initial {
  display: block;
  text-align: center;
  font-family: var(--font-accent-serif);
  font-style: italic;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1;
  color: #0a0a0a;
  letter-spacing: -0.02em;
}
</style>
