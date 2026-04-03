<template>
  <div
    :data-theme="theme"
    :data-font-pair="fontPairId"
    :data-icon-pack="iconPackId"
    :data-density="density"
    class="h-screen overflow-hidden"
  >
    <div class="flex h-full w-full flex-col bg-transparent lg:flex-row">
      <div class="flex h-full w-full flex-col overflow-hidden lg:flex-row">
        <div class="flex items-center justify-between border-b border-base-300/80 p-3 lg:hidden">
          <button
            class="btn btn-sm rounded-lg"
            type="button"
            aria-controls="mobile-sidebar"
            :aria-expanded="mobileSidebarOpen"
            @click="mobileSidebarOpen = !mobileSidebarOpen"
          >
            Menu
          </button>
          <slot name="mobileTitle">
            <span class="text-sm font-medium">Aura Workspace</span>
          </slot>
        </div>
        <aside
          id="desktop-sidebar"
          :class="[
            collapsed ? 'w-16' : 'w-[260px]',
            'hidden shrink-0 overflow-hidden border-r border-base-300/90 bg-base-200',
            'transition-[width] duration-200 ease-in-out lg:flex',
          ]"
        >
          <div
            :class="[
              collapsed
                ? 'flex h-full w-full flex-col overflow-x-hidden overflow-y-auto px-2 py-4'
                : 'flex h-full w-full flex-col overflow-x-hidden overflow-y-auto p-4',
            ]"
          >
            <!-- Header row: hamburger toggle + logo slot -->
            <div
              :class="['flex items-center mb-4', collapsed ? 'justify-center' : 'justify-between']"
            >
              <button
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-base-300/60"
                type="button"
                aria-controls="desktop-sidebar"
                :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
                :aria-expanded="!collapsed"
                @click="toggle"
              >
                <PhList :size="18" />
              </button>
              <slot name="sidebarHeader" :collapsed="collapsed" />
            </div>
            <slot name="sidebar" :collapsed="collapsed" :toggle="toggle" />
          </div>
        </aside>
        <aside
          id="mobile-sidebar"
          v-if="mobileSidebarOpen"
          class="border-b border-base-300/80 bg-base-100 p-4 lg:hidden"
        >
          <slot name="sidebar" :collapsed="collapsed" :toggle="toggle" />
        </aside>
        <main class="relative min-w-0 flex-1 overflow-hidden bg-base-100 p-3 md:p-6">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PhList } from '@phosphor-icons/vue'

import type { ThemeId } from '@/contracts/api'
import { useSidebarProvider } from '@/composables/useSidebarCollapse'

defineProps<{
  theme: ThemeId
  fontPairId: string
  iconPackId: string
  density: string
}>()

const mobileSidebarOpen = ref(false)
const { collapsed, toggle } = useSidebarProvider()
</script>
