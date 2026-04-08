<template>
  <section class="rounded-2xl border border-base-300/80 bg-base-100 p-4">
    <!-- Header -->
    <header class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h2 class="aura-heading text-lg font-semibold">Client Monitor</h2>
        <p class="text-xs text-base-content/55">{{ rows.length }} clients</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- Search -->
        <label class="input input-sm rounded-xl border-base-300/80">
          <PhMagnifyingGlass :size="15" class="text-base-content/50" />
          <input
            id="admin-client-grid-search"
            type="search"
            :value="query"
            class="min-w-[11rem]"
            placeholder="Search clients"
            @input="emit('update:query', ($event.target as HTMLInputElement).value)"
          />
        </label>

        <!-- Status filter -->
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

        <!-- Sort select -->
        <select
          class="select select-sm rounded-xl border-base-300/80"
          :value="sortKey"
          @change="onSortChange(($event.target as HTMLSelectElement).value as SortKey)"
        >
          <option value="company">Company</option>
          <option value="contactName">Contact</option>
          <option value="progress">Progress</option>
          <option value="lastActivity">Last Activity</option>
        </select>
      </div>
    </header>

    <!-- Loading state -->
    <div v-if="loading" class="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="index in 6"
        :key="index"
        class="skeleton h-32 rounded-2xl bg-base-200/90"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="rows.length === 0"
      class="py-12 text-center text-sm text-base-content/60"
    >
      No matching clients found.
    </div>

    <!-- Grid -->
    <div v-else class="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      <AdminClientCard
        v-for="client in rows"
        :key="client.id"
        :client="client"
        @select="emit('select-client', $event)"
        @add-seed="emit('add-seed', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PhMagnifyingGlass } from '@phosphor-icons/vue'

import AdminClientCard from '@/components/admin/AdminClientCard.vue'
import type { ClientSummary } from '@/contracts/api'

export type StatusFilter = 'all' | ClientSummary['status']
export type SortKey = 'company' | 'contactName' | 'progress' | 'lastActivity'
export type SortDirection = 'asc' | 'desc'

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

function onSortChange(nextKey: SortKey): void {
  emit('update:sortKey', nextKey)
  emit('update:sortDirection', nextKey === 'lastActivity' ? 'desc' : 'asc')
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
  const normalizedQuery = props.query.trim().toLowerCase()
  const filtered = props.clients.filter((client) => {
    if (props.statusFilter !== 'all' && client.status !== props.statusFilter) return false
    if (!normalizedQuery) return true
    return [client.company, client.contactName, client.email].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    )
  })

  const sorted = [...filtered]
  sorted.sort((left, right) => {
    let leftValue: string | number = left[props.sortKey] as string | number
    let rightValue: string | number = right[props.sortKey] as string | number

    if (props.sortKey === 'lastActivity') {
      leftValue = parseActivityScore(left.lastActivity)
      rightValue = parseActivityScore(right.lastActivity)
    }

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return props.sortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue
    }

    const compared = String(leftValue).localeCompare(String(rightValue))
    return props.sortDirection === 'asc' ? compared : -compared
  })

  return sorted
})
</script>
