<template>
  <div class="space-y-4">
    <!-- Seeds list -->
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-base-content/40">
        Source Knowledge
      </p>
      <ul class="space-y-2">
        <template v-if="seeds.length > 0">
          <li
            v-for="seed in seeds"
            :key="seed.id"
            class="rounded-xl border border-base-300/80 bg-base-200/45 p-2.5"
          >
            <!-- Normal view -->
            <div v-if="deletingId !== seed.id">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium">{{ seed.title }}</p>
                  <p class="text-xs capitalize text-base-content/55">{{ seed.sourceType }}</p>
                </div>
                <div class="flex shrink-0 items-center gap-1.5">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    :class="ingestBadgeClass(seed.id)"
                  >
                    <span class="h-1.5 w-1.5 rounded-full" :class="ingestDotClass(seed.id)" />
                    {{ ingestLabel(seed.id) }}
                  </span>
                  <button
                    class="btn btn-ghost btn-xs rounded-lg text-base-content/40 hover:text-error"
                    aria-label="Delete seed"
                    @click="deletingId = seed.id"
                  >
                    <PhTrash :size="14" />
                  </button>
                </div>
              </div>
              <!-- Progress bar -->
              <div class="mt-2 flex items-center gap-2">
                <progress
                  class="progress h-1.5 flex-1"
                  :class="ingestProgressClass(seed.id)"
                  :value="ingestProgress(seed.id)"
                  max="100"
                />
                <span class="w-8 text-right text-[11px] font-medium tabular-nums text-base-content/55">
                  {{ ingestProgress(seed.id) }}%
                </span>
              </div>
              <p class="mt-1.5 line-clamp-2 text-xs text-base-content/65">
                {{ seed.processedSummary ?? seed.rawTranscript ?? 'No summary yet.' }}
              </p>
            </div>

            <!-- Confirm delete view -->
            <div v-else class="flex items-center justify-between gap-3">
              <p class="text-sm text-base-content/70">
                Delete <span class="font-medium">{{ seed.title }}</span>?
              </p>
              <div class="flex shrink-0 gap-2">
                <button
                  class="btn btn-ghost btn-xs rounded-lg"
                  :disabled="isDeleting"
                  @click="deletingId = null"
                >
                  Cancel
                </button>
                <button
                  class="btn btn-error btn-xs rounded-lg"
                  :disabled="isDeleting"
                  @click="confirmDelete(seed.id)"
                >
                  <span v-if="isDeleting" class="loading loading-spinner loading-xs" />
                  <span v-else>Delete</span>
                </button>
              </div>
            </div>
          </li>
        </template>

        <!-- Empty state -->
        <li
          v-else
          class="rounded-xl border border-dashed border-base-300/80 p-4 text-center text-xs text-base-content/40"
        >
          No source knowledge uploaded yet.
        </li>
      </ul>
    </div>

    <!-- Divider + upload section -->
    <div class="border-t border-base-300/60 pt-4">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-base-content/40">
        Add Source Knowledge
      </p>
      <AdminSeedUploadCard :client-id="clientId" @seed-created="emit('seed-created', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { PhTrash } from '@phosphor-icons/vue'

import AdminSeedUploadCard from '@/components/admin/AdminSeedUploadCard.vue'
import { apiClient } from '@/services/api-client'
import type { AdminIngestState, AdminSeedRecord, IngestStatus } from '@/contracts/api'

// Static lookup — full class strings visible to Tailwind's content scanner
const PROGRESS_CLASS: Record<IngestStatus | 'unknown', string> = {
  ready:      'progress-success',
  processing: 'progress-warning',
  warning:    'progress-warning',
  failed:     'progress-error',
  queued:     'progress-primary',
  unknown:    'progress-primary',
}

const DOT_CLASS: Record<IngestStatus | 'unknown', string> = {
  ready:      'bg-success-content',
  processing: 'bg-warning-content',
  warning:    'bg-warning-content',
  queued:     'bg-warning-content',
  failed:     'bg-error-content',
  unknown:    'bg-base-content/40',
}

const props = defineProps<{
  seeds: AdminSeedRecord[]
  ingestStates: AdminIngestState[]
  clientId: string
}>()

const emit = defineEmits<{
  'seed-created': [seed: AdminSeedRecord]
  'seed-deleted': [seedId: string]
}>()

const deletingId = ref<string | null>(null)
const isDeleting = ref(false)

const ingestMap = computed<Record<string, AdminIngestState>>(() =>
  Object.fromEntries(props.ingestStates.map((s) => [s.seedId, s])),
)

function ingestState(seedId: string): AdminIngestState | undefined {
  return ingestMap.value[seedId]
}

function ingestLabel(seedId: string): string {
  const status = ingestState(seedId)?.status ?? 'unknown'
  if (status === 'ready') return 'Ready'
  if (status === 'processing') return 'Processing'
  if (status === 'queued') return 'Queued'
  if (status === 'warning') return 'Warning'
  if (status === 'failed') return 'Failed'
  return 'Pending'
}

function ingestProgress(seedId: string): number {
  return ingestState(seedId)?.progress ?? 0
}

function ingestProgressClass(seedId: string): string {
  const status = ingestState(seedId)?.status ?? 'unknown'
  return PROGRESS_CLASS[status]
}

function ingestDotClass(seedId: string): string {
  const status = ingestState(seedId)?.status ?? 'unknown'
  return DOT_CLASS[status]
}

function ingestBadgeClass(seedId: string): string {
  const status = ingestState(seedId)?.status ?? 'unknown'
  if (status === 'ready') return 'bg-success/20 text-success-content'
  if (status === 'queued' || status === 'processing' || status === 'warning')
    return 'bg-warning/30 text-warning-content'
  if (status === 'failed') return 'bg-error/20 text-error-content'
  return 'bg-base-300/80 text-base-content/70'
}

async function confirmDelete(seedId: string): Promise<void> {
  isDeleting.value = true
  try {
    await apiClient.deleteSeed(seedId)
    emit('seed-deleted', seedId)
  } catch (err) {
    console.error('Failed to delete seed:', err)
  } finally {
    isDeleting.value = false
    deletingId.value = null
  }
}
</script>
