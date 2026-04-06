<template>
  <div class="flex h-full min-h-0 w-full flex-col">
    <div class="admin-shell-section">
      <slot name="search">
        <button
          v-if="collapsed"
          type="button"
          class="admin-search-icon-button"
          :title="searchLabel"
          :aria-label="searchLabel"
          @click="$emit('search')"
        >
          <PhMagnifyingGlass :size="18" weight="regular" />
        </button>
        <button
          v-else
          type="button"
          class="admin-search-row"
          :title="searchLabel"
          @click="$emit('search')"
        >
          <span class="admin-search-icon" aria-hidden="true">
            <PhMagnifyingGlass :size="17" weight="regular" />
          </span>
          <span class="admin-search-label">{{ searchLabel }}</span>
          <kbd class="admin-command-hint">
            <span aria-hidden="true">{{ commandSymbol }}</span>
            <span>{{ commandKey }}</span>
          </kbd>
        </button>
      </slot>
    </div>

    <div class="admin-shell-nav flex min-h-0 flex-1 flex-col gap-4">
      <section v-for="section in sections" :key="section.title" class="admin-nav-group">
        <div v-if="!collapsed" class="admin-nav-group-header">
          <span>{{ section.title }}</span>
        </div>

        <div class="space-y-1">
          <template v-for="item in section.items" :key="item.label">
            <RouterLink
              v-if="item.to"
              :to="item.to"
              :class="navItemClass(item.active)"
              :title="collapsed ? item.label : undefined"
              :aria-label="collapsed ? item.label : undefined"
              @click="$emit('select', item.label)"
            >
              <component
                :is="item.icon ?? PhSquaresFour"
                :size="18"
                weight="regular"
                class="shrink-0"
              />
              <span v-if="!collapsed" class="min-w-0 flex-1 truncate">{{ item.label }}</span>
              <span v-if="!collapsed && item.badge" class="admin-nav-badge">{{ item.badge }}</span>
            </RouterLink>

            <a
              v-else-if="item.href"
              :href="item.href"
              :class="navItemClass(item.active)"
              :title="collapsed ? item.label : undefined"
              :aria-label="collapsed ? item.label : undefined"
              @click="$emit('select', item.label)"
            >
              <component
                :is="item.icon ?? PhSquaresFour"
                :size="18"
                weight="regular"
                class="shrink-0"
              />
              <span v-if="!collapsed" class="min-w-0 flex-1 truncate">{{ item.label }}</span>
              <span v-if="!collapsed && item.badge" class="admin-nav-badge">{{ item.badge }}</span>
            </a>

            <button
              v-else
              type="button"
              :class="navItemClass(item.active)"
              :title="collapsed ? item.label : undefined"
              :aria-label="collapsed ? item.label : undefined"
              @click="$emit('select', item.label)"
            >
              <component
                :is="item.icon ?? PhSquaresFour"
                :size="18"
                weight="regular"
                class="shrink-0"
              />
              <span v-if="!collapsed" class="min-w-0 flex-1 truncate">{{ item.label }}</span>
              <span v-if="!collapsed && item.badge" class="admin-nav-badge">{{ item.badge }}</span>
            </button>
          </template>
        </div>
      </section>
    </div>

    <div class="admin-shell-section admin-shell-section--footer mt-auto">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { PhMagnifyingGlass, PhSquaresFour } from '@phosphor-icons/vue'

import type { Component } from 'vue'

export interface AdminSidebarItem {
  label: string
  to?: string
  href?: string
  active?: boolean
  badge?: string
  icon?: Component
}

export interface AdminSidebarSection {
  title: string
  items: AdminSidebarItem[]
}

const props = withDefaults(
  defineProps<{
    searchLabel?: string
    commandKey?: string
    commandSymbol?: string
    collapsed?: boolean
    sections?: AdminSidebarSection[]
  }>(),
  {
    searchLabel: 'Search',
    commandKey: 'K',
    commandSymbol: 'Ctrl',
    collapsed: false,
    sections: () => [],
  },
)

defineEmits<{
  search: []
  select: [label: string]
}>()

const sections = computed(() => props.sections)

function navItemClass(active?: boolean) {
  return [
    'admin-nav-item',
    active ? 'admin-nav-item--active' : 'admin-nav-item--idle',
    props.collapsed ? 'justify-center px-2' : 'justify-start px-3',
  ]
}
</script>

