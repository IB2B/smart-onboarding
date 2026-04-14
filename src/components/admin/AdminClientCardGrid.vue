<template>
  <section class="rounded-2xl border border-base-300/80 bg-base-100">
    <!-- Toolbar -->
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/60 px-5 py-4">
      <div>
        <h2 class="aura-heading text-lg font-semibold">Clients</h2>
        <p class="text-xs text-base-content/50">{{ rows.length }} result{{ rows.length === 1 ? '' : 's' }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <label class="input input-sm rounded-xl border-base-300/80">
          <PhMagnifyingGlass :size="15" class="text-base-content/50" />
          <input
            type="search"
            :value="query"
            class="min-w-[11rem]"
            placeholder="Search clients…"
            @input="emit('update:query', ($event.target as HTMLInputElement).value)"
          />
        </label>

        <select
          class="select select-sm rounded-xl border-base-300/80"
          :value="statusFilter"
          @change="emit('update:statusFilter', ($event.target as HTMLSelectElement).value as StatusFilter)"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="space-y-px p-1">
      <div v-for="i in 5" :key="i" class="skeleton h-14 rounded-xl bg-base-200/80" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="rows.length === 0"
      class="py-16 text-center text-sm text-base-content/50"
    >
      No matching clients found.
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="table table-sm w-full">
        <thead>
          <tr class="text-[11px] uppercase tracking-widest text-base-content/40">
            <th>
              <button type="button" class="flex items-center gap-1 hover:text-base-content/70 transition-colors" @click="toggleSort('company')">
                Client
                <SortIcon :sort-key="sortKey" :direction="sortDirection" column="company" />
              </button>
            </th>
            <th class="hidden sm:table-cell">
              <button type="button" class="flex items-center gap-1 hover:text-base-content/70 transition-colors" @click="toggleSort('contactName')">
                Contact
                <SortIcon :sort-key="sortKey" :direction="sortDirection" column="contactName" />
              </button>
            </th>
            <th>Status</th>
            <th>
              <button type="button" class="flex items-center gap-1 hover:text-base-content/70 transition-colors" @click="toggleSort('progress')">
                Progress
                <SortIcon :sort-key="sortKey" :direction="sortDirection" column="progress" />
              </button>
            </th>
            <th class="hidden md:table-cell">
              <button type="button" class="flex items-center gap-1 hover:text-base-content/70 transition-colors" @click="toggleSort('lastActivity')">
                Last Active
                <SortIcon :sort-key="sortKey" :direction="sortDirection" column="lastActivity" />
              </button>
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="client in rows"
            :key="client.id"
            class="cursor-pointer hover:bg-base-200/60 transition-colors"
            :class="selectedClientId === client.id ? 'bg-primary/5' : ''"
            @click="emit('select-client', client.id)"
          >
            <!-- Client -->
            <td>
              <div class="flex items-center gap-3">
                <div
                  class="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                  :style="{ background: avatarGradient(client.company) }"
                  aria-hidden="true"
                >
                  {{ client.company.slice(0, 2).toUpperCase() }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium truncate max-w-[140px]">{{ client.company }}</p>
                  <p class="text-xs text-base-content/50 truncate max-w-[140px] sm:hidden">{{ client.contactName }}</p>
                </div>
              </div>
            </td>

            <!-- Contact (hidden on mobile, shown inline above) -->
            <td class="hidden sm:table-cell">
              <div class="min-w-0">
                <p class="text-sm truncate max-w-[140px]">{{ client.contactName }}</p>
                <p class="text-xs text-base-content/50 truncate max-w-[140px]">{{ client.email }}</p>
              </div>
            </td>

            <!-- Status -->
            <td>
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="statusClass(client.status)"
              >
                {{ client.status }}
              </span>
            </td>

            <!-- Progress -->
            <td>
              <div class="flex items-center gap-2 min-w-[80px]">
                <progress
                  class="progress progress-primary h-1.5 w-16"
                  :value="client.progress"
                  max="100"
                />
                <span class="text-xs tabular-nums text-base-content/60">{{ client.progress }}%</span>
              </div>
            </td>

            <!-- Last Active -->
            <td class="hidden md:table-cell text-xs text-base-content/50">
              {{ client.lastActivity }}
            </td>

            <!-- Actions -->
            <td @click.stop>
              <button
                type="button"
                class="btn btn-ghost btn-xs gap-1 rounded-lg text-base-content/50 hover:text-primary"
                title="Add source knowledge"
                @click="emit('add-seed', client.id)"
              >
                <PhPlus :size="13" />
                <span class="hidden sm:inline">Source</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { PhMagnifyingGlass, PhPlus, PhCaretUp, PhCaretDown, PhCaretUpDown } from '@phosphor-icons/vue'

import type { ClientSummary } from '@/contracts/api'

export type StatusFilter = 'all' | ClientSummary['status']
export type SortKey = 'company' | 'contactName' | 'progress' | 'lastActivity'
export type SortDirection = 'asc' | 'desc'

// Inline sort indicator — tiny functional component
const SortIcon = (p: { sortKey: SortKey; direction: SortDirection; column: SortKey }) => {
  if (p.sortKey !== p.column) return h(PhCaretUpDown, { size: 11, class: 'opacity-30' })
  return p.direction === 'asc'
    ? h(PhCaretUp, { size: 11, class: 'text-primary' })
    : h(PhCaretDown, { size: 11, class: 'text-primary' })
}

const props = defineProps<{
  clients: ClientSummary[]
  selectedClientId: string
  loading?: boolean
  query: string
  statusFilter: StatusFilter
  sortKey: SortKey
  sortDirection: SortDirection
}>()

const emit = defineEmits<{
  'update:query': [value: string]
  'update:statusFilter': [value: StatusFilter]
  'update:sortKey': [value: SortKey]
  'update:sortDirection': [value: SortDirection]
  'select-client': [clientId: string]
  'add-seed': [clientId: string]
}>()

function toggleSort(key: SortKey): void {
  if (props.sortKey === key) {
    emit('update:sortDirection', props.sortDirection === 'asc' ? 'desc' : 'asc')
  } else {
    emit('update:sortKey', key)
    emit('update:sortDirection', key === 'lastActivity' ? 'desc' : 'asc')
  }
}

function parseActivityScore(raw: string): number {
  const parsed = new Date(raw).getTime()
  if (!Number.isNaN(parsed)) return parsed
  const normalized = raw.trim().toLowerCase()
  const hours = normalized.match(/^(\d+)\s*h(?:ours?)?\s*ago$/)
  if (hours) return Date.now() - Number(hours[1] ?? 0) * 3_600_000
  const days = normalized.match(/^(\d+)\s*d(?:ays?)?\s*ago$/)
  if (days) return Date.now() - Number(days[1] ?? 0) * 24 * 3_600_000
  return 0
}

const rows = computed(() => {
  const q = props.query.trim().toLowerCase()
  const filtered = props.clients.filter((c) => {
    if (props.statusFilter !== 'all' && c.status !== props.statusFilter) return false
    if (!q) return true
    return [c.company, c.contactName, c.email].some((v) => v.toLowerCase().includes(q))
  })

  return [...filtered].sort((a, b) => {
    let av: string | number = a[props.sortKey] as string | number
    let bv: string | number = b[props.sortKey] as string | number
    if (props.sortKey === 'lastActivity') {
      av = parseActivityScore(a.lastActivity)
      bv = parseActivityScore(b.lastActivity)
    }
    if (typeof av === 'number' && typeof bv === 'number') {
      return props.sortDirection === 'asc' ? av - bv : bv - av
    }
    const cmp = String(av).localeCompare(String(bv))
    return props.sortDirection === 'asc' ? cmp : -cmp
  })
})

function avatarGradient(name: string): string {
  const hue = (name.charCodeAt(0) * 47) % 360
  return `linear-gradient(135deg, hsl(${hue}, 65%, 52%), hsl(${(hue + 40) % 360}, 65%, 45%))`
}

function statusClass(status: ClientSummary['status']): string {
  if (status === 'active') return 'bg-success/20 text-success-content'
  if (status === 'blocked') return 'bg-error/20 text-error-content'
  return 'bg-info/20 text-info-content'
}
</script>
