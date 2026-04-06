<template>
  <AppShell
    :theme="theme"
    :font-pair-id="fontPairId"
    :icon-pack-id="iconPackId"
    :density="density"
  >
    <template #sidebarHeader>
      <slot name="sidebarHeader">
        <AuraLogo :brand-name="brandName" />
      </slot>
    </template>

    <template #sidebar="{ collapsed }">
      <AdminSidebar
        :search-label="searchLabel"
        :command-key="commandKey"
        :command-symbol="commandSymbol"
        :collapsed="collapsed"
        :sections="sections"
        @search="$emit('search')"
        @select="$emit('select-nav', $event)"
      >
        <template #footer>
          <slot name="sidebarFooter" :collapsed="collapsed" />
        </template>
      </AdminSidebar>
    </template>

    <template #default="{ collapsed, toggle }">
      <div class="flex h-full min-h-0 flex-col">
        <AdminTopbar
          :title="title"
          :collapsed="collapsed"
          :cta-label="ctaLabel"
          @toggle-collapse="toggle"
        >
          <template #actions>
            <slot name="topbarActions" :collapsed="collapsed" />
          </template>
          <template #cta>
            <slot name="topbarCta" :collapsed="collapsed" />
          </template>
        </AdminTopbar>

        <main class="min-h-0 flex-1 overflow-auto bg-base-100">
          <slot :collapsed="collapsed" />
        </main>
      </div>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

import AppShell from '@/components/system/AppShell.vue'
import AuraLogo from '@/components/system/AuraLogo.vue'

import AdminSidebar from './AdminSidebar.vue'
import AdminTopbar from './AdminTopbar.vue'
import type { DensityId, FontPairId, IconPackId, ThemeId } from '@/contracts/api'

interface AdminSidebarItem {
  label: string
  to?: string
  href?: string
  active?: boolean
  badge?: string
  icon?: Component
}

interface AdminSidebarSection {
  title: string
  items: AdminSidebarItem[]
}

withDefaults(
  defineProps<{
    theme: ThemeId
    fontPairId: FontPairId
    iconPackId: IconPackId
    density: DensityId
    title: string
    ctaLabel?: string
    brandName?: string
    searchLabel?: string
    commandKey?: string
    commandSymbol?: string
    sections?: AdminSidebarSection[]
  }>(),
  {
    ctaLabel: '',
    brandName: 'IntelligentB2B',
    searchLabel: 'Search',
    commandKey: 'K',
    commandSymbol: 'Ctrl',
    sections: () => [],
  },
)

defineEmits<{
  search: []
  'select-nav': [label: string]
}>()
</script>

