<template>
  <AdminShellFrame
    :theme="store.decision.themeId"
    :font-pair-id="store.decision.fontPairId"
    :icon-pack-id="store.decision.iconPackId"
    :density="store.decision.density"
    title="Clients"
    brand-name="IntelligentB2B"
    search-label="Search clients"
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
        aria-label="Refresh clients"
        :disabled="isLoading"
        @click="loadClients"
      >
        <PhArrowClockwise :size="16" :class="isLoading ? 'animate-spin' : ''" />
      </button>
    </template>

    <template #topbarCta>
      <button
        type="button"
        class="btn btn-primary admin-action-button"
        @click="provisionOpen = true"
      >
        Invite Client
        <PhPlus :size="16" />
      </button>
    </template>

    <template #default>
      <div class="mx-auto flex w-full max-w-[1480px] flex-col gap-5 p-3 md:p-5">
        <p
          v-if="loadError"
          class="rounded-xl border border-error/40 bg-error/15 px-3 py-2 text-sm text-error-content"
        >
          {{ loadError }}
        </p>

        <AdminClientCardGrid
          :clients="clients"
          :selected-client-id="''"
          :loading="isLoading"
          v-model:query="query"
          v-model:status-filter="statusFilter"
          v-model:sort-key="sortKey"
          v-model:sort-direction="sortDirection"
          @select-client="handleSelectClient"
          @add-seed="handleAddSeed"
        />
      </div>
    </template>
  </AdminShellFrame>

  <SpotlightSearch :open="spotlightOpen" @close="spotlightOpen = false" />
  <ClientProvisionModal :open="provisionOpen" @close="provisionOpen = false" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  PhArrowClockwise,
  PhChartLineUp,
  PhChatTeardropText,
  PhPlus,
  PhUsersThree,
} from '@phosphor-icons/vue'

import SpotlightSearch from '@/components/system/SpotlightSearch.vue'
import { useHotkey } from '@/composables/useHotkey'
import AdminClientCardGrid, {
  type SortDirection,
  type SortKey,
  type StatusFilter,
} from '@/components/admin/AdminClientCardGrid.vue'
import AdminShellFrame from '@/components/admin/AdminShellFrame.vue'
import ClientProvisionModal from '@/components/admin/ClientProvisionModal.vue'
import ProfileDock from '@/components/system/ProfileDock.vue'
import type { ClientSummary } from '@/contracts/api'
import { apiClient } from '@/services/api-client'
import { useSpecLabStore } from '@/stores/spec-lab'
import { useAuthStore } from '@/stores/auth'

const store = useSpecLabStore()
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const spotlightOpen = ref(false)
const provisionOpen = ref(false)

useHotkey({
  key: 'k',
  modifiers: ['ctrl'],
  handler: () => { spotlightOpen.value = !spotlightOpen.value },
})

const isLoading = ref(true)
const loadError = ref('')
const clients = ref<ClientSummary[]>([])

const query = ref('')
const statusFilter = ref<StatusFilter>((route.query['status'] as StatusFilter) ?? 'all')
const sortKey = ref<SortKey>('lastActivity')
const sortDirection = ref<SortDirection>('desc')

const sidebarSections = computed(() => [
  {
    title: 'Monitor',
    items: [
      { label: 'Overview', to: '/admin/monitor', icon: PhChartLineUp },
      { label: 'Clients', to: '/admin/clients', active: true, icon: PhUsersThree, badge: String(clients.value.length) },
      { label: 'Alerts', to: '/admin/monitor', icon: PhChatTeardropText },
    ],
  },
  {
    title: 'Portal',
    items: [{ label: 'Client Chat', to: '/portal/chat/demo-token', icon: PhChatTeardropText }],
  },
])

async function loadClients(): Promise<void> {
  isLoading.value = true
  loadError.value = ''
  try {
    clients.value = await apiClient.getClients()
  } catch {
    loadError.value = 'Unable to load clients right now.'
  } finally {
    isLoading.value = false
  }
}

function handleSelectClient(clientId: string): void {
  router.push({ name: 'admin-client-detail', params: { id: clientId } })
}

function handleAddSeed(clientId: string): void {
  router.push({ name: 'admin-client-detail', params: { id: clientId }, query: { tab: 'seeds' } })
}

async function handleSignOut(): Promise<void> {
  try {
    await auth.signOut()
  } catch {
    // Non-fatal
  }
  await router.replace({ name: 'admin-login' })
}

onMounted(loadClients)
</script>
