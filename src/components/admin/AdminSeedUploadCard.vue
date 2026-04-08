<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  PhArrowSquareOut,
  PhFile,
  PhFileText,
  PhLink,
  PhMicrophoneStage,
  PhSpinner,
  PhX,
} from '@phosphor-icons/vue'

import type { AdminSeedRecord, SeedSourceType } from '@/contracts/api'
import { apiClient } from '@/services/api-client'

// ── Props / Emits ─────────────────────────────────────────────────────────────

const props = defineProps<{ clientId: string }>()
const emit = defineEmits<{ 'seed-created': [seed: AdminSeedRecord] }>()

// ── Tab config ────────────────────────────────────────────────────────────────

interface TabConfig {
  value: SeedSourceType
  label: string
}

const TABS: readonly TabConfig[] = [
  { value: 'notes', label: 'Notes' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Document' },
  { value: 'url', label: 'URL' },
]

const AUDIO_EXTENSIONS = ['.m4a', '.mp3', '.wav', '.webm', '.ogg'] as const
const DOCUMENT_EXTENSIONS = ['.pdf', '.txt', '.md', '.docx'] as const
const MAX_FILE_BYTES = 25 * 1024 * 1024

// ── State ─────────────────────────────────────────────────────────────────────

const activeTab = ref<SeedSourceType>('notes')

const title = ref('')
const content = ref('')
const url = ref('')
const file = ref<File | null>(null)

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isDragOver = ref(false)

// ── Computed ──────────────────────────────────────────────────────────────────

const isFormValid = computed<boolean>(() => {
  const hasTitle = title.value.trim().length > 0
  switch (activeTab.value) {
    case 'notes':
      return hasTitle && content.value.trim().length > 0
    case 'audio':
    case 'document':
      return hasTitle && file.value !== null
    case 'url':
      return hasTitle && url.value.trim().length > 0
    default:
      return false
  }
})

const acceptAttr = computed<string>(() => {
  if (activeTab.value === 'audio') return AUDIO_EXTENSIONS.join(',')
  if (activeTab.value === 'document') return DOCUMENT_EXTENSIONS.join(',')
  return ''
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx === -1 ? '' : filename.slice(idx).toLowerCase()
}

function validateFile(candidate: File): string | null {
  if (candidate.size > MAX_FILE_BYTES) {
    return 'File must be under 25 MB'
  }
  const ext = getExtension(candidate.name)
  if (activeTab.value === 'audio' && !(AUDIO_EXTENSIONS as readonly string[]).includes(ext)) {
    return `Unsupported audio format. Accepted: ${AUDIO_EXTENSIONS.join(', ')}`
  }
  if (
    activeTab.value === 'document' &&
    !(DOCUMENT_EXTENSIONS as readonly string[]).includes(ext)
  ) {
    return `Unsupported document format. Accepted: ${DOCUMENT_EXTENSIONS.join(', ')}`
  }
  return null
}

function resetForm() {
  title.value = ''
  content.value = ''
  url.value = ''
  file.value = null
  errorMessage.value = ''
  isDragOver.value = false
}

function selectTab(tab: SeedSourceType) {
  if (tab === activeTab.value) return
  activeTab.value = tab
  resetForm()
}

// ── File input handling ────────────────────────────────────────────────────────

function onFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = input.files?.[0]
  if (!selected) return

  const validationError = validateFile(selected)
  if (validationError) {
    errorMessage.value = validationError
    input.value = ''
    file.value = null
    return
  }

  errorMessage.value = ''
  file.value = selected
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false

  const dropped = event.dataTransfer?.files?.[0]
  if (!dropped) return

  const validationError = validateFile(dropped)
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  errorMessage.value = ''
  file.value = dropped
}

// ── Submission ────────────────────────────────────────────────────────────────

async function submit() {
  if (!isFormValid.value || loading.value) return
  errorMessage.value = ''
  loading.value = true

  try {
    let seed: AdminSeedRecord

    switch (activeTab.value) {
      case 'notes':
        seed = await apiClient.createNoteSeed({
          clientId: props.clientId,
          title: title.value.trim(),
          content: content.value.trim(),
        })
        break

      case 'audio':
      case 'document':
        seed = await apiClient.uploadSeedFile({
          clientId: props.clientId,
          file: file.value!,
          title: title.value.trim(),
          sourceType: activeTab.value,
        })
        break

      case 'url':
        seed = await apiClient.createUrlSeed({
          clientId: props.clientId,
          title: title.value.trim(),
          url: url.value.trim(),
        })
        break
    }

    emit('seed-created', seed)
    resetForm()
    successMessage.value = 'Knowledge source added — processing will begin shortly.'
    setTimeout(() => { successMessage.value = '' }, 4000)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card border border-base-300/80 bg-base-100 shadow-sm rounded-2xl">
    <div class="card-body p-0">

      <!-- Header -->
      <header class="flex items-center gap-2 border-b border-base-300/60 px-5 py-4">
        <PhFileText :size="18" weight="duotone" class="text-primary" aria-hidden="true" />
        <h3 class="aura-heading text-base font-semibold">Add Knowledge Source</h3>
      </header>

      <!-- Tabs -->
      <div
        class="tabs tabs-bordered px-5 pt-4"
        role="tablist"
        aria-label="Knowledge source type"
      >
        <button
          v-for="tab in TABS"
          :key="tab.value"
          role="tab"
          type="button"
          class="tab text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          :class="activeTab === tab.value ? 'tab-active font-semibold' : 'text-base-content/60'"
          :aria-selected="activeTab === tab.value"
          @click="selectTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Form -->
      <form novalidate class="px-5 pb-5 pt-4" @submit.prevent="submit">
        <div class="space-y-4">

          <!-- Title (shared by all tabs) -->
          <div class="form-control">
            <label class="label pb-1" for="seed-title">
              <span class="label-text text-sm font-medium">Title</span>
            </label>
            <input
              id="seed-title"
              v-model="title"
              type="text"
              class="input input-bordered input-sm rounded-xl border-base-300/80 w-full"
              placeholder="Give this source a name"
              :disabled="loading"
              required
            />
          </div>

          <!-- Notes tab -->
          <template v-if="activeTab === 'notes'">
            <div class="form-control">
              <label class="label pb-1" for="seed-content">
                <span class="label-text text-sm font-medium">Content</span>
              </label>
              <textarea
                id="seed-content"
                v-model="content"
                class="textarea textarea-bordered textarea-sm rounded-xl border-base-300/80 w-full resize-y"
                placeholder="Paste or type the knowledge content here…"
                rows="4"
                :disabled="loading"
                required
              />
            </div>
          </template>

          <!-- Audio tab -->
          <template v-else-if="activeTab === 'audio'">
            <div class="form-control">
              <label class="label pb-1" for="seed-audio-file">
                <span class="label-text text-sm font-medium">Audio File</span>
                <span class="label-text-alt text-xs text-base-content/50">
                  .m4a .mp3 .wav .webm .ogg — max 25 MB
                </span>
              </label>
              <label
                class="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-base-300/80 bg-base-200/30 px-4 py-5 text-center transition-colors hover:bg-base-200/60"
                :class="{ 'border-primary/50 bg-primary/5': file }"
                for="seed-audio-file"
              >
                <PhMicrophoneStage
                  :size="28"
                  weight="duotone"
                  class="transition-colors"
                  :class="file ? 'text-primary' : 'text-base-content/40'"
                  aria-hidden="true"
                />
                <span v-if="file" class="text-sm font-medium text-base-content/80 break-all">
                  {{ file.name }}
                </span>
                <span v-else class="text-sm text-base-content/50">
                  Click to browse audio file
                </span>
                <input
                  id="seed-audio-file"
                  type="file"
                  class="sr-only"
                  :accept="acceptAttr"
                  :disabled="loading"
                  @change="onFileInputChange"
                />
              </label>
            </div>
          </template>

          <!-- Document tab -->
          <template v-else-if="activeTab === 'document'">
            <div class="form-control">
              <label class="label pb-1" for="seed-doc-file">
                <span class="label-text text-sm font-medium">Document</span>
                <span class="label-text-alt text-xs text-base-content/50">
                  .pdf .txt .md .docx — max 25 MB
                </span>
              </label>
              <!-- Drag-and-drop zone -->
              <div
                class="relative flex flex-col items-center gap-2 rounded-xl border border-dashed border-base-300/80 bg-base-200/30 px-4 py-5 text-center transition-colors"
                :class="{
                  'border-primary/60 bg-primary/5': isDragOver,
                  'border-primary/50 bg-primary/5': file && !isDragOver,
                }"
                @dragover="onDragOver"
                @dragleave="onDragLeave"
                @drop="onDrop"
              >
                <PhFile
                  :size="28"
                  weight="duotone"
                  class="pointer-events-none transition-colors"
                  :class="file || isDragOver ? 'text-primary' : 'text-base-content/40'"
                  aria-hidden="true"
                />
                <span v-if="file" class="text-sm font-medium text-base-content/80 break-all">
                  {{ file.name }}
                </span>
                <span v-else-if="isDragOver" class="text-sm font-medium text-primary">
                  Drop it here
                </span>
                <span v-else class="text-sm text-base-content/50">
                  Drag &amp; drop or
                  <label
                    for="seed-doc-file"
                    class="cursor-pointer font-medium text-primary underline-offset-2 hover:underline"
                  >
                    browse
                  </label>
                </span>
                <input
                  id="seed-doc-file"
                  type="file"
                  class="sr-only"
                  :accept="acceptAttr"
                  :disabled="loading"
                  @change="onFileInputChange"
                />
              </div>
            </div>
          </template>

          <!-- URL tab -->
          <template v-else-if="activeTab === 'url'">
            <div class="form-control">
              <label class="label pb-1" for="seed-url">
                <span class="label-text text-sm font-medium">URL</span>
              </label>
              <div class="relative flex items-center">
                <PhLink
                  :size="15"
                  weight="bold"
                  class="pointer-events-none absolute left-3 text-base-content/40"
                  aria-hidden="true"
                />
                <input
                  id="seed-url"
                  v-model="url"
                  type="url"
                  class="input input-bordered input-sm rounded-xl border-base-300/80 w-full pl-8"
                  placeholder="https://example.com/page"
                  :disabled="loading"
                  required
                />
              </div>
            </div>
          </template>

          <!-- Success alert -->
          <div
            v-if="successMessage"
            role="status"
            class="alert alert-success rounded-xl py-2.5 text-sm"
          >
            <span class="flex-1">{{ successMessage }}</span>
          </div>

          <!-- Error alert -->
          <div
            v-if="errorMessage"
            role="alert"
            class="alert alert-error rounded-xl py-2.5 text-sm"
          >
            <span class="flex-1">{{ errorMessage }}</span>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
              aria-label="Dismiss error"
              @click="errorMessage = ''"
            >
              <PhX :size="14" weight="bold" aria-hidden="true" />
            </button>
          </div>

          <!-- Submit -->
          <div class="pt-1">
            <button
              type="submit"
              class="btn btn-primary btn-sm w-full rounded-xl transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              :disabled="loading || !isFormValid"
            >
              <PhSpinner
                v-if="loading"
                :size="16"
                weight="bold"
                aria-hidden="true"
                class="animate-spin"
              />
              <PhArrowSquareOut
                v-else
                :size="16"
                weight="bold"
                aria-hidden="true"
              />
              <span>{{ loading ? 'Adding…' : 'Add Source' }}</span>
            </button>
          </div>

        </div>
      </form>

    </div>
  </div>
</template>
