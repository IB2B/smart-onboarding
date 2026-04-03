<template>
  <AppShell
    :theme="store.decision.themeId"
    :font-pair-id="store.decision.fontPairId"
    :icon-pack-id="store.decision.iconPackId"
    :density="store.decision.density"
  >
    <template #sidebar>
      <AuraLogo />
      <div class="mt-6 space-y-2">
        <RouterLink class="btn btn-primary btn-sm w-full justify-start rounded-xl" to="/admin/monitor">Admin Monitor</RouterLink>
        <RouterLink class="btn btn-sm w-full justify-start rounded-xl" to="/portal/chat/demo-token">Client Portal</RouterLink>
      </div>
      <ProfileDock detail="Monitoring Portal" name="Aura Admin" />
    </template>

    <div class="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <header class="mb-4 flex items-center justify-between">
          <h1 class="aura-heading text-2xl font-semibold">Client Monitor</h1>
          <span class="text-xs text-base-content/60">{{ clients.length }} clients</span>
        </header>
        <div class="overflow-x-auto">
          <p v-if="loadError" class="mb-3 rounded-xl border border-error/40 bg-error/15 p-2 text-xs text-error-content">{{ loadError }}</p>
          <table class="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="client in clients" :key="client.id">
                <td>
                  <button
                    class="btn btn-ghost btn-sm h-auto min-h-0 rounded-lg px-2 py-1 text-left"
                    type="button"
                    @click="selectClient(client.id)"
                  >
                    {{ client.company }}
                  </button>
                </td>
                <td class="text-xs">{{ client.contactName }}</td>
                <td><StatusChip :status="client.status" /></td>
                <td>{{ client.progress }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <header class="mb-4 flex items-center justify-between">
          <h2 class="font-semibold">Thread Replay</h2>
          <span class="text-xs text-base-content/60">{{ activeClient?.company ?? 'No selection' }}</span>
        </header>
        <div class="max-h-[68vh] space-y-3 overflow-y-auto pr-1" aria-live="polite">
          <ThreadBlock v-for="message in thread" :key="message.id" :message="message" />
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { apiClient } from '@/services/api-client'
import AuraLogo from '@/components/system/AuraLogo.vue'
import AppShell from '@/components/system/AppShell.vue'
import ProfileDock from '@/components/system/ProfileDock.vue'
import StatusChip from '@/components/system/StatusChip.vue'
import ThreadBlock from '@/components/system/ThreadBlock.vue'
import type { ClientSummary, ThreadMessage } from '@/contracts/api'
import { useSpecLabStore } from '@/stores/spec-lab'

const store = useSpecLabStore()

const clients = ref<ClientSummary[]>([])
const activeClientId = ref<string>('')
const thread = ref<ThreadMessage[]>([])
const loadError = ref('')

const activeClient = computed(() => clients.value.find((client) => client.id === activeClientId.value))

async function selectClient(clientId: string) {
  try {
    activeClientId.value = clientId
    thread.value = await apiClient.getClientThread(clientId)
  } catch {
    loadError.value = 'Unable to load client thread.'
  }
}

onMounted(async () => {
  try {
    clients.value = await apiClient.getClients()
    const firstClient = clients.value[0]
    if (firstClient) {
      await selectClient(firstClient.id)
    }
  } catch {
    loadError.value = 'Unable to load clients list.'
  }
})
</script>
