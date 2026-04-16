<template>
  <div :data-theme="store.decision.themeId" class="contents">
    <AdminShellFrame
      :theme="store.decision.themeId"
      :font-pair-id="store.decision.fontPairId"
      :icon-pack-id="store.decision.iconPackId"
      :density="store.decision.density"
      title="Alerts"
      brand-name="IntelligentB2B"
      search-label="Search alerts"
      command-symbol="Ctrl"
      command-key="K"
      :sections="sidebarSections"
      @search="spotlightOpen = true"
    >
      <template #sidebarFooter>
        <ProfileDock
          detail="Monitoring Portal"
          :name="auth.userEmail ?? 'Admin'"
          @sign-out="handleSignOut"
        />
      </template>

      <template #topbarActions>
        <button
          type="button"
          class="btn btn-sm rounded-lg border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200"
          aria-label="Refresh alerts"
          :disabled="isLoading"
          @click="loadData"
        >
          <PhArrowClockwise :size="16" :class="isLoading ? 'animate-spin' : ''" />
        </button>
      </template>

      <template #default>
        <div class="mx-auto flex w-full max-w-[1480px] flex-col gap-5 p-3 md:p-5">
          <!-- Error -->
          <p
            v-if="loadError"
            class="rounded-xl border border-error/40 bg-error/15 px-3 py-2 text-sm text-error-content"
          >
            {{ loadError }}
          </p>

          <!-- Summary strip -->
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div
              v-for="chip in summaryChips"
              :key="chip.label"
              class="flex flex-col gap-1 rounded-xl border border-base-300/80 bg-base-100 px-4 py-4"
              :class="chip.borderClass"
            >
              <span
                class="text-xs font-semibold uppercase tracking-wide"
                :class="chip.labelClass"
                >{{ chip.label }}</span
              >
              <span class="text-2xl font-bold tabular-nums" :class="chip.colorClass">{{
                chip.count
              }}</span>
            </div>
          </div>

          <!-- Filter bar -->
          <div
            class="flex flex-wrap items-center gap-2 rounded-xl border border-base-300/80 bg-base-100 px-4 py-3"
          >
            <!-- Search -->
            <div class="relative min-w-[180px] flex-1">
              <PhMagnifyingGlass
                class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/40"
                :size="15"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search alerts…"
                class="input input-sm w-full rounded-lg border-base-300/80 bg-base-200/40 pl-8 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <!-- Severity pills -->
            <div class="flex items-center gap-1">
              <button
                v-for="pill in severityPills"
                :key="pill.value"
                type="button"
                class="badge badge-sm cursor-pointer rounded-full border-0 px-3 py-2 text-xs font-medium transition-opacity"
                :class="
                  severityFilter === pill.value
                    ? pill.activeClass
                    : 'bg-base-200 text-base-content/55 opacity-60 hover:opacity-100'
                "
                @click="severityFilter = pill.value"
              >
                {{ pill.label }}
              </button>
            </div>

            <!-- Status toggle -->
            <div class="flex items-center gap-1">
              <button
                v-for="opt in statusOptions"
                :key="opt.value"
                type="button"
                class="badge badge-sm cursor-pointer rounded-full border-0 px-3 py-2 text-xs font-medium transition-opacity"
                :class="
                  statusFilter === opt.value
                    ? 'bg-primary/20 text-primary'
                    : 'bg-base-200 text-base-content/55 opacity-60 hover:opacity-100'
                "
                @click="statusFilter = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>

            <!-- Category dropdown -->
            <select
              v-model="categoryFilter"
              class="select select-sm rounded-lg border-base-300 bg-base-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All categories</option>
              <option v-for="cat in categoryOptions" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>

          <!-- Table card -->
          <div class="rounded-xl border border-base-300/80 bg-base-100 overflow-hidden">
            <!-- Loading skeletons -->
            <template v-if="isLoading">
              <div class="divide-y divide-base-300/40">
                <div v-for="n in 3" :key="n" class="flex items-center gap-4 px-5 py-4">
                  <div class="skeleton h-5 w-5 shrink-0 rounded-full bg-base-200/80" />
                  <div class="flex flex-1 flex-col gap-1.5">
                    <div class="skeleton h-3.5 w-48 rounded bg-base-200/80" />
                    <div class="skeleton h-3 w-72 rounded bg-base-200/80" />
                  </div>
                  <div class="skeleton h-5 w-16 rounded-full bg-base-200/80" />
                  <div class="skeleton h-5 w-12 rounded-full bg-base-200/80" />
                </div>
              </div>
            </template>

            <!-- Empty state -->
            <template v-else-if="filteredAlerts.length === 0">
              <div
                class="flex flex-col items-center justify-center gap-2 py-16 text-base-content/40"
              >
                <PhBellSlash :size="32" />
                <p class="text-sm font-medium">No alerts match your filters</p>
              </div>
            </template>

            <!-- Table -->
            <table v-else class="w-full text-sm">
              <thead>
                <tr
                  class="border-b border-base-300/60 text-left text-xs font-medium text-base-content/50"
                >
                  <th class="px-5 py-3 w-8" aria-label="Severity" />
                  <th class="px-5 py-3">Alert</th>
                  <th class="hidden px-5 py-3 sm:table-cell">Client</th>
                  <th class="hidden px-5 py-3 md:table-cell">Category</th>
                  <th class="hidden px-5 py-3 lg:table-cell">Date</th>
                  <th class="px-5 py-3">Status</th>
                  <th class="w-8 px-5 py-3" aria-label="Navigate" />
                </tr>
              </thead>
              <tbody class="divide-y divide-base-300/40">
                <tr
                  v-for="alert in filteredAlerts"
                  :key="alert.id"
                  class="group cursor-pointer transition-colors hover:bg-base-200/50"
                >
                  <!-- Severity icon -->
                  <td class="px-5 py-3.5">
                    <component
                      :is="severityIcon(alert.severity)"
                      :size="16"
                      :class="severityTextClass(alert.severity)"
                      aria-hidden="true"
                    />
                  </td>

                  <!-- Title + description -->
                  <td class="px-5 py-3.5 max-w-[280px]">
                    <p class="font-medium text-base-content truncate">{{ alert.title }}</p>
                    <p class="mt-0.5 text-xs text-base-content/55 truncate">
                      {{ alert.description }}
                    </p>
                  </td>

                  <!-- Client -->
                  <td class="hidden px-5 py-3.5 sm:table-cell text-base-content/70">
                    {{ alert.clientId ? (clientsMap[alert.clientId]?.company ?? '—') : '—' }}
                  </td>

                  <!-- Category badge -->
                  <td class="hidden px-5 py-3.5 md:table-cell">
                    <span
                      class="badge badge-sm rounded-full border-0"
                      :class="categoryBadgeClass(alert.category)"
                    >
                      {{ categoryLabel(alert.category) }}
                    </span>
                  </td>

                  <!-- Date -->
                  <td
                    class="hidden px-5 py-3.5 lg:table-cell text-xs text-base-content/55 tabular-nums whitespace-nowrap"
                  >
                    {{ formatDate(alert.createdAt) }}
                  </td>

                  <!-- Status badge -->
                  <td class="px-5 py-3.5">
                    <span
                      class="badge badge-sm rounded-full border-0"
                      :class="
                        alert.status === 'open'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-500'
                      "
                    >
                      {{ alert.status === 'open' ? 'Open' : 'Resolved' }}
                    </span>
                  </td>

                  <!-- Navigate arrow -->
                  <td class="px-5 py-3.5">
                    <button
                      v-if="alert.clientId"
                      type="button"
                      class="opacity-0 group-hover:opacity-100 transition-all text-base-content/40 hover:text-primary cursor-pointer"
                      :aria-label="`View client for alert ${alert.title}`"
                      @click="navigateToClient(alert.clientId)"
                    >
                      <PhArrowRight :size="15" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </AdminShellFrame>

    <SpotlightSearch :open="spotlightOpen" @close="spotlightOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  PhArrowClockwise,
  PhArrowRight,
  PhBell,
  PhBellSlash,
  PhInfo,
  PhMagnifyingGlass,
  PhWarning,
  PhXCircle,
} from '@phosphor-icons/vue'

import { supabase } from '@/lib/supabase'
import { useAdminSidebar } from '@/composables/useAdminSidebar'

import SpotlightSearch from '@/components/system/SpotlightSearch.vue'
import { useHotkey } from '@/composables/useHotkey'
import AdminShellFrame from '@/components/admin/AdminShellFrame.vue'
import ProfileDock from '@/components/system/ProfileDock.vue'
import type { AdminAlert, AlertSeverity, ClientSummary } from '@/contracts/api'
import { apiClient } from '@/services/api-client'
import { useSpecLabStore } from '@/stores/spec-lab'
import { useAuthStore } from '@/stores/auth'

type SeverityFilter = 'all' | AlertSeverity
type StatusFilter = 'all' | 'open' | 'resolved'
type CategoryFilter = 'all' | AdminAlert['category']

const store = useSpecLabStore()
const auth = useAuthStore()
const router = useRouter()

const spotlightOpen = ref(false)

useHotkey({
  key: 'k',
  modifiers: ['ctrl'],
  handler: () => {
    spotlightOpen.value = !spotlightOpen.value
  },
})

const isLoading = ref(true)
const loadError = ref('')
const alerts = ref<AdminAlert[]>([])
const clients = ref<ClientSummary[]>([])

const searchQuery = ref('')
const severityFilter = ref<SeverityFilter>('all')
const statusFilter = ref<StatusFilter>('all')
const categoryFilter = ref<CategoryFilter>('all')

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const sidebarSections = useAdminSidebar('alerts')

// ─── Derived maps ─────────────────────────────────────────────────────────────

const clientsMap = computed<Record<string, ClientSummary>>(() =>
  Object.fromEntries(clients.value.map((c) => [c.id, c])),
)

// ─── Summary chips ────────────────────────────────────────────────────────────

const openAlerts = computed(() => alerts.value.filter((a) => a.status === 'open'))

const summaryChips = computed(() => [
  {
    label: 'Total Open',
    count: openAlerts.value.length,
    colorClass: 'text-slate-800 dark:text-slate-500',
    labelClass: 'text-slate-500',
    borderClass: 'border-l-4 border-l-slate-300',
  },
  {
    label: 'Critical',
    count: openAlerts.value.filter((a) => a.severity === 'critical').length,
    colorClass: 'text-red-600',
    labelClass: 'text-red-500',
    borderClass: 'border-l-4 border-l-red-500',
  },
  {
    label: 'Warning',
    count: openAlerts.value.filter((a) => a.severity === 'warning').length,
    colorClass: 'text-amber-500',
    labelClass: 'text-amber-500',
    borderClass: 'border-l-4 border-l-amber-400',
  },
  {
    label: 'Info',
    count: openAlerts.value.filter((a) => a.severity === 'info').length,
    colorClass: 'text-blue-500',
    labelClass: 'text-blue-400',
    borderClass: 'border-l-4 border-l-blue-400',
  },
])

// ─── Filter options ───────────────────────────────────────────────────────────

const severityPills: { value: SeverityFilter; label: string; activeClass: string }[] = [
  { value: 'all', label: 'All', activeClass: 'bg-primary/20 text-primary' },
  { value: 'critical', label: 'Critical', activeClass: 'bg-red-100 text-red-600' },
  { value: 'warning', label: 'Warning', activeClass: 'bg-amber-100 text-amber-600' },
  { value: 'info', label: 'Info', activeClass: 'bg-blue-100 text-blue-600' },
]

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
]

const categoryOptions: { value: AdminAlert['category']; label: string }[] = [
  { value: 'review', label: 'Needs Review' },
  { value: 'stale', label: 'Stale' },
  { value: 'ingest', label: 'Ingest' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'message', label: 'Message' },
  { value: 'ops', label: 'Ops' },
]

// ─── Filtered list ────────────────────────────────────────────────────────────

const filteredAlerts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return alerts.value.filter((alert) => {
    if (severityFilter.value !== 'all' && alert.severity !== severityFilter.value) return false
    if (statusFilter.value !== 'all' && alert.status !== statusFilter.value) return false
    if (categoryFilter.value !== 'all' && alert.category !== categoryFilter.value) return false
    if (q) {
      const clientName = alert.clientId ? (clientsMap.value[alert.clientId]?.company ?? '') : ''
      const haystack = `${alert.title} ${alert.description} ${clientName}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityIcon(severity: AlertSeverity) {
  if (severity === 'critical') return PhXCircle
  if (severity === 'warning') return PhWarning
  return PhInfo
}

function severityTextClass(severity: AlertSeverity): string {
  if (severity === 'critical') return 'text-red-600'
  if (severity === 'warning') return 'text-amber-500'
  return 'text-blue-500'
}

function categoryLabel(category: AdminAlert['category']): string {
  const labels: Record<AdminAlert['category'], string> = {
    review: 'Review',
    stale: 'Stale',
    ingest: 'Ingest',
    milestone: 'Milestone',
    message: 'Message',
    ops: 'Ops',
  }
  return labels[category] ?? category
}

function categoryBadgeClass(category: AdminAlert['category']): string {
  const classes: Record<AdminAlert['category'], string> = {
    review: 'bg-amber-100 text-amber-700',
    stale: 'bg-amber-100 text-amber-700',
    ingest: 'bg-blue-100 text-blue-700',
    milestone: 'bg-violet-100 text-violet-700',
    message: 'bg-emerald-100 text-emerald-700',
    ops: 'bg-slate-100 text-slate-600',
  }
  return classes[category] ?? 'bg-slate-100 text-slate-600'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function navigateToClient(clientId: string): void {
  router.push({ name: 'admin-client-detail', params: { id: clientId } })
}

// ─── Data loading ─────────────────────────────────────────────────────────────

async function loadData(): Promise<void> {
  isLoading.value = true
  loadError.value = ''
  try {
    const [alertRecords, clientRecords] = await Promise.all([
      apiClient.getAdminAlerts(),
      apiClient.getClients(),
    ])
    alerts.value = alertRecords
    clients.value = clientRecords
  } catch {
    loadError.value = 'Unable to load alerts right now.'
  } finally {
    isLoading.value = false
  }
}

async function handleSignOut(): Promise<void> {
  try {
    await auth.signOut()
  } catch {
    // Non-fatal
  }
  await router.replace({ name: 'admin-login' })
}

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null
let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  loadData()

  // Auto-refresh every 60 s
  refreshInterval = setInterval(() => {
    loadData()
  }, 60_000)

  // Realtime: reload when any onboarding_states row is updated
  realtimeChannel = supabase
    .channel('alerts-view-onboarding')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'onboarding_states' },
      () => {
        loadData()
      },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'onboarding_states' },
      () => {
        loadData()
      },
    )
    .subscribe()
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})
</script>
