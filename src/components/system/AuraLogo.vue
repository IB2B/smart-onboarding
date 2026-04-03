<template>
  <div :aria-label="brandName ?? 'Aura'">
    <Transition name="fade" mode="out-in">
      <span
        v-if="!collapsed"
        key="full"
        class="aura-brand-name select-none"
      >
        {{ brandName ?? 'Aura' }}
      </span>
      <span
        v-else
        key="initial"
        class="aura-brand-initial select-none"
        aria-hidden="true"
      >
        {{ (brandName ?? 'Aura')[0] }}
      </span>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useSidebarState } from '@/composables/useSidebarCollapse'

withDefaults(
  defineProps<{
    brandName?: string
  }>(),
  {
    brandName: 'Aura',
  },
)

const { collapsed } = useSidebarState()
</script>

<style scoped>
.aura-brand-name {
  font-family: 'Dancing Script', cursive;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(135deg, #3b4fd4 0%, #5b6cff 50%, #7ca6ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.02em;
}

.aura-brand-initial {
  font-family: 'Dancing Script', cursive;
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(135deg, #3b4fd4 0%, #5b6cff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
