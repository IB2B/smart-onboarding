<template>
  <section class="rounded-xl border border-base-300/80 bg-base-100 overflow-hidden">
    <!-- Toolbar -->
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-base-300/60 px-5 py-4">
      <div>
        <h2 class="aura-heading text-lg font-semibold">Clients</h2>
        <p class="text-xs text-base-content/50">{{ subtitle }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <label class="input input-sm rounded-lg border-base-300/80 bg-base-200/40">
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
          class="select select-sm rounded-lg border-base-300/80 bg-base-100 text-sm"
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
          <tr class="text-[11px] uppercase tracking-wide text-base-content/50">
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
            <th class="hidden lg:table-cell">
              <button type="button" class="flex items-center gap-1 hover:text-base-content/70 transition-colors" @click="toggleSort('phase')">
                Phase
                <SortIcon :sort-key="sortKey" :direction="sortDirection" column="phase" />
              </button>
            </th>
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
            v-for="client in pagedRows"
            :key="client.id"
            class="cursor-pointer hover:bg-base-200/60 transition-colors"
            :class="selectedClientId === client.id ? 'bg-primary/8 ring-1 ring-inset ring-primary/20' : ''"
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
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap"
                :class="statusClass(client.status)"
              >
                {{ client.status }}
              </span>
            </td>

            <!-- Phase -->
            <td class="hidden lg:table-cell">
              <span
                class="rounded-full px-2 py-0.5 text-[11px] font-medium"
                :class="phaseClass(client.phase)"
              >
                {{ phaseLabel(client.phase) }}
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
                class="btn btn-ghost btn-xs gap-1 rounded-lg text-base-content/45 hover:text-primary hover:bg-primary/8 transition-colors cursor-pointer"
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

    <!-- Pagination footer -->
    <footer
      v-if="rows.length > PAGE_SIZE"
      class="flex items-center justify-between border-t border-base-300/60 px-5 py-2.5"
    >
      <button
        type="button"
        class="btn btn-sm btn-ghost rounded-lg gap-1.5 text-xs text-base-content/55 hover:text-base-content cursor-pointer disabled:cursor-not-allowed transition-colors"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        <PhArrowLeft :size="13" /> Prev
      </button>
      <span class="text-xs tabular-nums text-base-content/45">{{ currentPage }} / {{ totalPages }}</span>
      <button
        type="button"
        class="btn btn-sm btn-ghost rounded-lg gap-1.5 text-xs text-base-content/55 hover:text-base-content cursor-pointer disabled:cursor-not-allowed transition-colors"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        Next <PhArrowRight :size="13" />
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { PhMagnifyingGlass, PhPlus, PhCaretUp, PhCaretDown, PhCaretUpDown, PhArrowLeft, PhArrowRight } from '@phosphor-icons/vue'

import type { ClientSummary, OnboardingPhase } from '@/contracts/api'

export type StatusFilter = 'all' | ClientSummary['status']
export type SortKey = 'company' | 'contactName' | 'phase' | 'progress' | 'lastActivity'
export type SortDirection = 'asc' | 'desc'

const PAGE_SIZE = 25

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

const currentPage = ref(1)

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

const PHASE_ORDER: Record<OnboardingPhase, number> = {
  welcome: 0,
  brand_identity: 1,
  technical_needs: 2,
  target_audience: 3,
  timeline_budget: 4,
  review: 5,
  complete: 6,
}

const rows = computed(() => {
  const q = props.query.trim().toLowerCase()
  const filtered = props.clients.filter((c) => {
    if (props.statusFilter !== 'all' && c.status !== props.statusFilter) return false
    if (!q) return true
    return [c.company, c.contactName, c.email].some((v) => v.toLowerCase().includes(q))
  })

  return [...filtered].sort((a, b) => {
    if (props.sortKey === 'lastActivity') {
      const av = parseActivityScore(a.lastActivity)
      const bv = parseActivityScore(b.lastActivity)
      return props.sortDirection === 'asc' ? av - bv : bv - av
    }
    if (props.sortKey === 'phase') {
      const av = PHASE_ORDER[a.phase]
      const bv = PHASE_ORDER[b.phase]
      return props.sortDirection === 'asc' ? av - bv : bv - av
    }
    const av: string | number = a[props.sortKey] as string | number
    const bv: string | number = b[props.sortKey] as string | number
    if (typeof av === 'number' && typeof bv === 'number') {
      return props.sortDirection === 'asc' ? av - bv : bv - av
    }
    const cmp = String(av).localeCompare(String(bv))
    return props.sortDirection === 'asc' ? cmp : -cmp
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(rows.value.length / PAGE_SIZE)))

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return rows.value.slice(start, start + PAGE_SIZE)
})

const subtitle = computed(() => {
  const total = rows.value.length
  if (total <= PAGE_SIZE) return `${total} result${total === 1 ? '' : 's'}`
  const start = (currentPage.value - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage.value * PAGE_SIZE, total)
  return `Showing ${start}–${end} of ${total}`
})

watch(
  () => rows.value.length,
  () => {
    currentPage.value = 1
  },
)

function avatarGradient(name: string): string {
  const hue = (name.charCodeAt(0) * 47) % 360
  return `linear-gradient(135deg, hsl(${hue}, 65%, 52%), hsl(${(hue + 40) % 360}, 65%, 45%))`
}

function statusClass(status: ClientSummary['status']): string {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700'
  if (status === 'blocked') return 'bg-red-100 text-red-700'
  return 'bg-blue-100 text-blue-700'
}

const PHASE_META: Record<OnboardingPhase, { label: string; cls: string }> = {
  welcome: { label: 'Welcome', cls: 'bg-base-300 text-base-content/60' },
  brand_identity: { label: 'Brand', cls: 'bg-violet-100 text-violet-700' },
  technical_needs: { label: 'Technical', cls: 'bg-blue-100 text-blue-700' },
  target_audience: { label: 'Audience', cls: 'bg-cyan-100 text-cyan-700' },
  timeline_budget: { label: 'Timeline', cls: 'bg-amber-100 text-amber-700' },
  review: { label: 'Review', cls: 'bg-orange-100 text-orange-700' },
  complete: { label: 'Complete', cls: 'bg-emerald-100 text-emerald-700' },
}

function phaseLabel(phase: OnboardingPhase): string {
  return PHASE_META[phase].label
}

function phaseClass(phase: OnboardingPhase): string {
  return PHASE_META[phase].cls
}
</script>
