<template>
  <div
    :data-theme="theme"
    :data-font-pair="fontPairId"
    :data-icon-pack="iconPackId"
    :data-density="density"
    class="h-dvh overflow-hidden"
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
            <span class="aura-topbar-title text-sm">Smart Onboarding</span>
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
            <div class="mb-5 flex items-center justify-center">
              <slot name="sidebarHeader" :collapsed="collapsed" />
            </div>
            <slot name="sidebar" :collapsed="collapsed" :toggle="toggle" />
          </div>
        </aside>
        <Transition
          enter-active-class="transition-[max-height,opacity] duration-200 ease-out overflow-hidden"
          leave-active-class="transition-[max-height,opacity] duration-150 ease-in overflow-hidden"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-[60vh] opacity-100"
          leave-from-class="max-h-[60vh] opacity-100"
          leave-to-class="max-h-0 opacity-0"
        >
          <aside
            v-if="mobileSidebarOpen"
            id="mobile-sidebar"
            class="border-b border-base-300/80 bg-base-100 p-4 lg:hidden"
          >
            <slot name="sidebar" :collapsed="collapsed" :toggle="toggle" />
          </aside>
        </Transition>
        <main class="relative min-w-0 flex-1 overflow-hidden bg-base-100 p-3 md:p-6">
          <slot :collapsed="collapsed" :toggle="toggle" />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import type { ThemeId } from '@/contracts/api'
import { useSidebarProvider } from '@/composables/useSidebarCollapse'

defineProps<{
  theme: ThemeId
  fontPairId: string
  iconPackId: string
  density: string
}>()

const mobileSidebarOpen = ref(false)
const { collapsed, toggle } = useSidebarProvider(false)
</script>
