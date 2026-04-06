<template>
  <header class="admin-topbar-shell">
    <div class="flex min-w-0 flex-1 items-center gap-3">
      <button
        type="button"
        class="admin-collapse-button"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-expanded="!collapsed"
        @click="$emit('toggle-collapse')"
      >
        <PhSidebarSimple :size="19" weight="regular" />
      </button>

      <span class="admin-topbar-divider" aria-hidden="true" />

      <div class="min-w-0">
        <slot name="title">
          <h1 class="admin-topbar-title truncate">{{ title }}</h1>
        </slot>
      </div>
    </div>

    <div class="admin-topbar-actions">
      <slot name="actions" />

      <slot name="cta">
        <button v-if="ctaLabel" type="button" class="btn btn-primary admin-action-button">
          {{ ctaLabel }}
          <PhPlus :size="16" weight="regular" />
        </button>
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import { PhPlus, PhSidebarSimple } from '@phosphor-icons/vue'

withDefaults(
  defineProps<{
    title: string
    collapsed?: boolean
    ctaLabel?: string
  }>(),
  {
    collapsed: false,
    ctaLabel: '',
  },
)

defineEmits<{
  'toggle-collapse': []
}>()
</script>
