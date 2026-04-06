<template>
  <section class="rounded-2xl border border-base-300/80 bg-base-100 p-4 overflow-hidden">
    <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="aura-heading text-lg font-semibold">Client Monitor</h2>
        <p class="text-xs text-base-content/55">{{ rows.length }} visible clients</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <label class="input input-sm rounded-xl border-base-300/80">
          <PhMagnifyingGlass :size="15" class="text-base-content/50" />
          <input
            id="admin-client-search"
            type="search"
            :value="query"
            class="min-w-[11rem]"
            placeholder="Search clients"
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

    <div class="overflow-x-auto">
      <table class="table table-sm">
        <thead>
          <tr>
            <th>
              <button type="button" class="admin-table-sort" @click="toggleSort('company')">
                Company
                <PhCaretUp v-if="sortKey === 'company' && sortDirection === 'asc'" :size="11" weight="bold" />
                <PhCaretDown v-else-if="sortKey === 'company' && sortDirection === 'desc'" :size="11" weight="bold" />
              </button>
            </th>
            <th>
              <button type="button" class="admin-table-sort" @click="toggleSort('contactName')">
                Contact
                <PhCaretUp v-if="sortKey === 'contactName' && sortDirection === 'asc'" :size="11" weight="bold" />
                <PhCaretDown v-else-if="sortKey === 'contactName' && sortDirection === 'desc'" :size="11" weight="bold" />
              </button>
            </th>
            <th>Status</th>
            <th>
              <button type="button" class="admin-table-sort" @click="toggleSort('progress')">
                Progress
                <PhCaretUp v-if="sortKey === 'progress' && sortDirection === 'asc'" :size="11" weight="bold" />
                <PhCaretDown v-else-if="sortKey === 'progress' && sortDirection === 'desc'" :size="11" weight="bold" />
              </button>
            </th>
            <th>
              <button type="button" class="admin-table-sort" @click="toggleSort('lastActivity')">
                Last Activity
                <PhCaretUp v-if="sortKey === 'lastActivity' && sortDirection === 'asc'" :size="11" weight="bold" />
                <PhCaretDown v-else-if="sortKey === 'lastActivity' && sortDirection === 'desc'" :size="11" weight="bold" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody v-if="loading">
          <tr v-for="index in 5" :key="index">
            <td colspan="5">
              <div class="skeleton h-8 w-full rounded-lg bg-base-200/90" />
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr v-if="rows.length === 0">
            <td colspan="5" class="py-8 text-center text-sm text-base-content/60">No matching clients found.</td>
          </tr>
          <tr
            v-for="client in rows"
            :key="client.id"
            class="cursor-pointer transition-colors duration-150 hover:bg-base-200/40"
            :class="client.id === selectedClientId ? 'bg-primary/8' : ''"
          >
            <td class="min-w-[14rem]">
              <button type="button" class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-base-200/80 transition-colors cursor-pointer" @click="emit('select-client', client.id)">
                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold text-white" :style="{ background: avatarGradient(client.company) }">
                  {{ client.company.slice(0, 2).toUpperCase() }}
                </div>
                <span class="text-sm font-medium tracking-[-0.01em]">{{ client.company }}</span>
              </button>
            </td>
            <td>
              <div class="text-sm text-base-content/85">{{ client.contactName }}</div>
              <div class="text-xs text-base-content/55">{{ client.email }}</div>
            </td>
            <td>
              <StatusChip :status="client.status" />
            </td>
            <td>
              <div class="flex items-center gap-2">
                <progress class="progress progress-primary h-2 w-24 rounded-full" :value="client.progress" max="100" />
                <span class="text-xs font-medium">{{ client.progress }}%</span>
              </div>
            </td>
            <td class="text-xs text-base-content/65">{{ client.lastActivity }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PhMagnifyingGlass, PhCaretUp, PhCaretDown } from '@phosphor-icons/vue'

import StatusChip from '@/components/system/StatusChip.vue'
import type { ClientSummary } from '@/contracts/api'

export type SortKey = 'company' | 'contactName' | 'progress' | 'lastActivity'
export type SortDirection = 'asc' | 'desc'
export type StatusFilter = 'all' | ClientSummary['status']

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
}>()

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
    return [client.company, client.contactName, client.email].some((value) => value.toLowerCase().includes(normalizedQuery))
  })

  const sorted = [...filtered]
  sorted.sort((left, right) => {
    let leftValue: string | number = left[props.sortKey]
    let rightValue: string | number = right[props.sortKey]

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

function toggleSort(nextKey: SortKey) {
  if (props.sortKey === nextKey) {
    emit('update:sortDirection', props.sortDirection === 'asc' ? 'desc' : 'asc')
    return
  }
  emit('update:sortKey', nextKey)
  emit('update:sortDirection', nextKey === 'lastActivity' ? 'desc' : 'asc')
}

function avatarGradient(name: string): string {
  const hue = (name.charCodeAt(0) * 47) % 360
  return `linear-gradient(135deg, hsl(${hue}, 65%, 52%), hsl(${(hue + 40) % 360}, 65%, 45%))`
}
</script>

