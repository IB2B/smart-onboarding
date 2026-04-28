<template>
  <AppShell
    :theme="store.decision.themeId"
    :font-pair-id="store.decision.fontPairId"
    :icon-pack-id="store.decision.iconPackId"
    :density="store.decision.density"
  >
    <template #sidebarHeader>
      <AuraLogo brand-name="IntelligentB2B" />
    </template>

    <template #sidebar="{ collapsed }">
      <template v-if="!collapsed">
        <!-- Search -->
        <button
          type="button"
          class="mt-4 flex w-full items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-base-content/40 hover:bg-base-200/60"
          @click="spotlightOpen = true"
        >
          <PhMagnifyingGlass :size="16" />
          <span class="flex-1 text-left text-sm font-medium tracking-[-0.01em]">Search</span>
          <kbd class="inline-flex items-center gap-1.5 rounded border border-base-300 bg-base-200 px-1.5 py-0.5 text-[10px] text-primary">
            <span aria-hidden="true">⌘</span>
            <span>K</span>
          </kbd>
        </button>

        <!-- Nav items -->
        <nav class="mt-3 flex flex-col gap-0.5">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium text-base-content/70 transition-colors duration-100 hover:bg-base-300/50 hover:text-base-content"
          >
            <PhClockCounterClockwise :size="17" />
            <span>History</span>
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium text-base-content/70 transition-colors duration-100 hover:bg-base-300/50 hover:text-base-content"
          >
            <PhFile :size="17" />
            <span>Documents</span>
          </button>
        </nav>

      </template>

      <template v-else>
        <div class="mt-4 flex flex-col items-center gap-1">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-base-content/45 hover:bg-base-300/50 hover:text-base-content/70"
            aria-label="Search"
            @click="spotlightOpen = true"
          >
            <PhMagnifyingGlass :size="18" />
          </button>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-base-content/45 hover:bg-base-300/50 hover:text-base-content/70"
            aria-label="History"
          >
            <PhClockCounterClockwise :size="18" />
          </button>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-base-content/45 hover:bg-base-300/50 hover:text-base-content/70"
            aria-label="Documents"
          >
            <PhFile :size="18" />
          </button>
        </div>
      </template>

      <ProfileDock
        :detail="auth.userEmail ?? ''"
        :name="clientName || (auth.userEmail ?? '')"
        @sign-out="handleSignOut"
      />
    </template>

    <template #default="{ collapsed, toggle }">
      <div class="flex h-full flex-col">
      <header class="admin-topbar-shell -mx-3 -mt-3 mb-4 md:-mx-6 md:-mt-6">
        <!-- Left: collapse + title -->
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            class="admin-collapse-button"
            aria-label="Toggle sidebar"
            :aria-expanded="!collapsed"
            @click="toggle"
          >
            <PhSidebarSimple :size="19" weight="regular" />
          </button>
          <span class="admin-topbar-divider" aria-hidden="true" />
          <h1 class="admin-topbar-title truncate">Smart Onboarding</h1>
        </div>
        <!-- Center: milestone progress bar -->
        <PortalProgressBar :onboarding-state="onboarding.onboardingState" />
        <!-- Right: balance placeholder -->
        <div class="flex-1" />
      </header>

      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- POST-ONBOARDING: review / complete state -->
        <PostOnboardingView
          v-if="isPostOnboarding && !loading && onboarding.onboardingState"
          :onboarding-state="onboarding.onboardingState"
          :brief="clientBrief"
          :brief-loading="briefLoading"
          @approve="handleBriefApprove"
        />

        <Transition v-else name="fade" mode="out-in">
          <!-- LOADING STATE -->
          <div v-if="loading" key="loading" class="flex flex-1 items-center justify-center px-4">
            <div class="w-full max-w-xl rounded-[1.8rem] border border-base-300/70 bg-base-100 px-6 py-8 shadow-sm">
              <div class="flex flex-col items-center text-center">
                <div class="relative flex items-center justify-center">
                  <div class="absolute h-24 w-24 rounded-full bg-primary/15 blur-xl orb-glow" />
                  <div class="relative flex h-16 w-16 items-center justify-center rounded-full border border-base-300/70 bg-base-200">
                    <span class="loading loading-spinner loading-md text-primary" aria-hidden="true" />
                  </div>
                </div>
                <h2 class="aura-heading mt-5 text-2xl font-semibold text-base-content">
                  Opening your portal
                </h2>
                <p class="mt-2 max-w-md text-sm leading-6 text-base-content/60">
                  We’re loading your onboarding conversation, progress, and next steps.
                </p>
              </div>

              <div class="mt-8 space-y-3">
                <div class="h-3 w-28 animate-pulse rounded-full bg-base-300/70" />
                <div class="h-10 w-full animate-pulse rounded-2xl bg-base-200" />
                <div class="h-10 w-[82%] animate-pulse rounded-2xl bg-base-200" />
                <div class="h-3 w-24 animate-pulse rounded-full bg-base-300/70" />
              </div>
            </div>
          </div>

          <!-- WELCOME STATE: no messages -->
          <div v-else-if="showWelcome" key="welcome" class="flex flex-1 flex-col items-center justify-center px-4">
            <div class="relative flex items-center justify-center">
              <div class="absolute h-24 w-24 rounded-full bg-primary/20 blur-xl orb-glow" />
              <div class="relative h-20 w-20 rounded-full orb" />
            </div>
            <h1 class="aura-heading mt-5 text-center text-[28px] font-medium leading-[1.2] tracking-[-0.04em] text-base-content">
              Welcome back,
              <span class="aura-hero-emphasis">
                {{ clientName || 'there' }}!
              </span>
            </h1>
            <p class="mt-[10px] max-w-[421px] text-center text-[14px] font-medium leading-[1.22] tracking-[-0.04em] text-base-content/60">
              {{ clientCompany ? `Let's continue setting up ${clientCompany}. I'm here to guide you through the rest of your onboarding.` : "Let's pick up right where we left off. I'm here to guide you through your onboarding." }}
            </p>
            <div class="mt-9 w-full max-w-[930px]">
              <FloatingComposer
                v-model="draft"
                label="Message composer"
                placeholder="Initiate a query or send a command to the AI..."
                :attachments="attachments.map(a => ({ name: a.name, type: a.type }))"
                @submit="sendMessage"
                @attach="handleAttach"
                @send-audio="handleSendAudio"
                @remove-attachment="removeAttachment"
              />
            </div>
          </div>

          <!-- CONVERSATION STATE: has messages -->
          <div v-else key="conversation" class="flex flex-1 flex-col overflow-hidden">
            <div ref="scrollContainer" class="relative flex-1 overflow-y-auto px-4 py-4">
              <div class="mx-auto w-full max-w-[920px] space-y-4" aria-live="polite">
                <ThreadBlock
                  v-for="message in sessionMessages"
                  :key="message.id"
                  :message="message"
                  @widget-respond="handleWidgetRespond"
                  @retry="retryMessage"
                />
                <Transition name="fade">
                  <TypingIndicator v-if="sending && !streaming" :label="'Thinking…'" />
                </Transition>
              </div>
              <Transition name="fade">
                <button
                  v-if="!isNearBottom && sessionMessages.length > 0"
                  type="button"
                  class="absolute bottom-4 right-4 z-10 btn btn-circle btn-sm btn-neutral shadow-md opacity-80 hover:opacity-100"
                  aria-label="Scroll to bottom"
                  @click="scrollToBottom('smooth')"
                >
                  <PhArrowDown :size="16" aria-hidden="true" />
                </button>
              </Transition>
            </div>
            <div class="shrink-0 px-4 pb-4">
              <div class="mx-auto w-full max-w-[930px]">
                <FloatingComposer
                  v-model="draft"
                  label="Message composer"
                  placeholder="Initiate a query or send a command to the AI..."
                  :attachments="attachments.map(a => ({ name: a.name, type: a.type }))"
                  @submit="sendMessage"
                  @attach="handleAttach"
                  @send-audio="handleSendAudio"
                  @remove-attachment="removeAttachment"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>

        <p v-if="loadError" class="mx-auto mt-2 w-full max-w-[920px] rounded-xl border border-error/40 bg-error/15 p-3 text-sm text-error-content">
          {{ loadError }}
        </p>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,.csv,image/*"
        class="hidden"
        @change="onFileSelected"
      />
      <SpotlightSearch :open="spotlightOpen" @close="spotlightOpen = false" />
      <MilestoneToast />
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  PhArrowDown,
  PhClockCounterClockwise,
  PhFile,
  PhMagnifyingGlass,
  PhSidebarSimple,
} from '@phosphor-icons/vue'

import { apiClient } from '@/services/api-client'
import { useAuthStore } from '@/stores/auth'
import { useOnboardingStore } from '@/stores/onboarding'
import AuraLogo from '@/components/system/AuraLogo.vue'
import AppShell from '@/components/system/AppShell.vue'
import FloatingComposer from '@/components/system/FloatingComposer.vue'
import ProfileDock from '@/components/system/ProfileDock.vue'
import SpotlightSearch from '@/components/system/SpotlightSearch.vue'
import ThreadBlock from '@/components/system/ThreadBlock.vue'
import TypingIndicator from '@/components/chat/TypingIndicator.vue'
import PortalProgressBar from '@/components/portal/PortalProgressBar.vue'
import PostOnboardingView from '@/components/portal/PostOnboardingView.vue'
import MilestoneToast from '@/components/portal/MilestoneToast.vue'
import type { MessageAttachment, OnboardingBrief, ThreadMessage } from '@/contracts/api'
import { useSpecLabStore } from '@/stores/spec-lab'
import { useHotkey } from '@/composables/useHotkey'
import { useAutoScroll } from '@/composables/useAutoScroll'
import { useMilestoneConfetti } from '@/composables/useMilestoneConfetti'

const store = useSpecLabStore()
const auth = useAuthStore()
const onboarding = useOnboardingStore()
useMilestoneConfetti()
const router = useRouter()
const draft = ref('')
const spotlightOpen = ref(false)
const attachments = ref<Array<{ name: string; type: 'file' | 'audio'; file?: File }>>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)

const { isNearBottom, scrollToBottom } = useAutoScroll(scrollContainer)

useHotkey({
  key: 'k',
  modifiers: ['ctrl'],
  handler: () => {
    spotlightOpen.value = !spotlightOpen.value
  },
})
const sessionMessages = ref<ThreadMessage[]>([])
const sending = ref(false)
const streaming = ref(false)
const loadError = ref('')
const loading = ref(true)
const showWelcome = ref(true)
const clientName = ref('')
const clientCompany = ref('')
const clientBrief = ref<OnboardingBrief | null>(null)
const briefLoading = ref(false)
let briefPollTimer: ReturnType<typeof setTimeout> | null = null
let briefPollAttempts = 0
const BRIEF_MAX_POLL_ATTEMPTS = 40 // ~2 min at 3s intervals

const isPostOnboarding = computed(() => onboarding.isPostOnboarding)

watch(
  () => sessionMessages.value.length,
  async () => {
    await nextTick()
    if (isNearBottom.value) {
      scrollToBottom('smooth')
    }
  },
)

let resolvedClientId = ''
let resolvedSessionId = ''

async function loadClientBrief() {
  if (!resolvedClientId) return
  if (briefPollTimer) {
    clearTimeout(briefPollTimer)
    briefPollTimer = null
  }
  briefLoading.value = briefPollAttempts === 0
  try {
    const briefs = await apiClient.getClientBriefs(resolvedClientId)
    clientBrief.value = briefs.find((b) => b.briefType === 'non_technical') ?? null
    briefPollAttempts++
    // Keep polling while generating OR while no brief has appeared yet (function may still be running)
    const stillWaiting = clientBrief.value === null || clientBrief.value.status === 'generating'
    if (stillWaiting && briefPollAttempts < BRIEF_MAX_POLL_ATTEMPTS) {
      briefPollTimer = setTimeout(loadClientBrief, 3000)
    }
  } catch {
    // Non-fatal — retry up to limit
    briefPollAttempts++
    if (briefPollAttempts < BRIEF_MAX_POLL_ATTEMPTS) {
      briefPollTimer = setTimeout(loadClientBrief, 3000)
    }
  } finally {
    briefLoading.value = false
  }
}

onMounted(async () => {
  try {
    await auth.init()
    const session = await apiClient.getPortalSession()
    resolvedClientId = session.session.clientId
    resolvedSessionId = `session-${resolvedClientId}`
    clientName.value = session.session.contactName
    clientCompany.value = session.session.companyName
    sessionMessages.value = [...session.session.messages]
    showWelcome.value = session.session.messages.length === 0
    onboarding.setState(session.onboardingState)
    // Load brief immediately if already in review/complete
    const phase = session.onboardingState?.phase
    if (phase === 'review' || phase === 'complete') {
      loadClientBrief()
    }
  } catch {
    loadError.value = 'Unable to load the session right now. Please retry.'
  } finally {
    loading.value = false
  }
})

function handleAttach(): void {
  fileInputRef.value?.click()
}

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024 // 25 MB
const SEED_READY_POLL_INTERVAL_MS = 1500
const SEED_READY_MAX_WAIT_MS = 30000

type UploadedSeedRef = {
  id: string
  title: string
  sourceType: 'document' | 'audio'
  transcript?: string
}

function onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  if (file.size > MAX_ATTACHMENT_BYTES) {
    loadError.value = 'File is too large. Maximum attachment size is 25 MB.'
    return
  }
  attachments.value = [...attachments.value, { name: file.name, type: 'file', file }]
}

function removeAttachment(index: number): void {
  attachments.value = attachments.value.filter((_, i) => i !== index)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function deriveAudioExtension(mimeType: string): string {
  const base = mimeType.split(';')[0]?.trim() ?? ''
  switch (base) {
    case 'audio/mp4':
      return 'mp4'
    case 'audio/ogg':
      return 'ogg'
    case 'audio/webm':
    default:
      return 'webm'
  }
}

async function waitForSeedProcessing(seedIds: string[]): Promise<{
  ready: UploadedSeedRef[]
  failed: UploadedSeedRef[]
  pending: UploadedSeedRef[]
}> {
  const deadline = Date.now() + SEED_READY_MAX_WAIT_MS
  let latestRows = await apiClient.getAdminSeedRecords(resolvedClientId)

  while (Date.now() < deadline) {
    const tracked = latestRows.filter((row) => seedIds.includes(row.id))
    const unresolved = tracked.filter(
      (row) => row.ingestStatus !== 'ready' && row.ingestStatus !== 'failed',
    )

    if (tracked.length === seedIds.length && unresolved.length === 0) {
      return {
        ready: tracked
          .filter((row) => row.ingestStatus === 'ready')
          .map((row) => ({
            id: row.id,
            title: row.title,
            sourceType: row.sourceType as 'document' | 'audio',
            transcript: row.rawTranscript,
          })),
        failed: tracked
          .filter((row) => row.ingestStatus === 'failed')
          .map((row) => ({
            id: row.id,
            title: row.title,
            sourceType: row.sourceType as 'document' | 'audio',
          })),
        pending: [],
      }
    }

    await sleep(SEED_READY_POLL_INTERVAL_MS)
    latestRows = await apiClient.getAdminSeedRecords(resolvedClientId)
  }

  const tracked = latestRows.filter((row) => seedIds.includes(row.id))
  return {
    ready: tracked
      .filter((row) => row.ingestStatus === 'ready')
      .map((row) => ({
        id: row.id,
        title: row.title,
        sourceType: row.sourceType as 'document' | 'audio',
        transcript: row.rawTranscript,
      })),
    failed: tracked
      .filter((row) => row.ingestStatus === 'failed')
      .map((row) => ({
        id: row.id,
        title: row.title,
        sourceType: row.sourceType as 'document' | 'audio',
      })),
    pending: tracked
      .filter((row) => row.ingestStatus !== 'ready' && row.ingestStatus !== 'failed')
      .map((row) => ({
        id: row.id,
        title: row.title,
        sourceType: row.sourceType as 'document' | 'audio',
      })),
  }
}

function formatSeedTitles(seeds: UploadedSeedRef[]): string {
  if (seeds.length === 0) return ''
  if (seeds.length === 1) return `"${seeds[0]!.title}"`
  if (seeds.length === 2) return `"${seeds[0]!.title}" and "${seeds[1]!.title}"`
  return `${seeds.slice(0, -1).map((seed) => `"${seed.title}"`).join(', ')}, and "${seeds[seeds.length - 1]!.title}"`
}

function buildSubmissionMessage(messageText: string, uploadedSeeds: UploadedSeedRef[]): string {
  const trimmed = messageText.trim()
  if (uploadedSeeds.length === 0) return trimmed

  const audioSeeds = uploadedSeeds.filter((s) => s.sourceType === 'audio')
  const docSeeds = uploadedSeeds.filter((s) => s.sourceType === 'document')

  const parts: string[] = []
  if (trimmed) parts.push(trimmed)

  // Embed transcripts directly so the AI sees the actual content regardless of RAG quality
  for (const seed of audioSeeds) {
    if (seed.transcript) {
      parts.push(`[Voice note transcription — "${seed.title}"]\n${seed.transcript}\n[End of transcription]`)
    }
  }

  if (audioSeeds.length > 0 && audioSeeds.every((s) => !s.transcript)) {
    const titles = formatSeedTitles(audioSeeds)
    parts.push(`Use the newly processed voice ${audioSeeds.length === 1 ? 'note' : 'notes'} ${titles} in your response.`)
  }

  if (docSeeds.length > 0) {
    const titles = formatSeedTitles(docSeeds)
    const sourceLabel = docSeeds.length === 1 ? 'source' : 'sources'
    parts.push(`Use the newly uploaded ${sourceLabel} ${titles} in your response.`)
  }

  return parts.join('\n\n')
}

async function uploadAndProcessAttachments(items: Array<{ name: string; file: File }>): Promise<UploadedSeedRef[]> {
  if (!resolvedClientId || items.length === 0) return []

  const uploadedSeeds: UploadedSeedRef[] = []

  for (const item of items) {
    const seed = await apiClient.uploadSeedFile({
      clientId: resolvedClientId,
      file: item.file,
      title: item.name,
      sourceType: 'document',
    })

    uploadedSeeds.push({
      id: seed.id,
      title: seed.title,
      sourceType: 'document',
    })
  }

  const processed = await waitForSeedProcessing(uploadedSeeds.map((seed) => seed.id))

  if (processed.failed.length > 0) {
    const failedTitles = processed.failed.map((seed) => seed.title).join(', ')
    throw new Error(`These uploads could not be processed: ${failedTitles}.`)
  }

  if (processed.pending.length > 0 && processed.ready.length === 0) {
    throw new Error('Your uploaded file is still being processed. Please wait a few seconds and try again.')
  }

  return processed.ready
}

function applySnapshotDelta(delta: Parameters<typeof onboarding.applySnapshotDelta>[0]) {
  onboarding.applySnapshotDelta(delta)
  if (delta.phase === 'review') {
    briefPollAttempts = 0
    loadClientBrief()
  }
}

async function handleSendAudio(blob: Blob, durationSec = 0): Promise<void> {
  if (!resolvedClientId || sending.value || streaming.value) return
  sending.value = true
  showWelcome.value = false

  // Create a local object URL for in-session playback
  const previewUrl = URL.createObjectURL(blob)
  const tempId = `user_${Date.now()}`

  // Show the audio bubble immediately (optimistic)
  sessionMessages.value = [
    ...sessionMessages.value,
    {
      id: tempId,
      role: 'client',
      content: '',
      createdAt: new Date().toISOString(),
      attachments: [{ type: 'audio', name: 'Voice note', previewUrl, durationSec }],
    },
  ]
  scrollToBottom('instant')

  try {
    loadError.value = ''
    const extension = deriveAudioExtension(blob.type || 'audio/webm')
    const audioFile = new File([blob], `voice-note-${Date.now()}.${extension}`, {
      type: blob.type || 'audio/webm',
    })
    const seed = await apiClient.uploadSeedFile({
      clientId: resolvedClientId,
      file: audioFile,
      title: 'Voice note',
      sourceType: 'audio',
    })
    const processed = await waitForSeedProcessing([seed.id])

    if (processed.failed.length > 0) {
      throw new Error('The voice note could not be transcribed.')
    }

    if (processed.pending.length > 0 && processed.ready.length === 0) {
      throw new Error('Your voice note is still being transcribed. Please wait a few seconds and try again.')
    }

    const transcript = processed.ready[0]?.transcript
    // Update the optimistic bubble with the transcript for display
    sessionMessages.value = sessionMessages.value.map((m) =>
      m.id === tempId
        ? { ...m, attachments: [{ type: 'audio', name: 'Voice note', previewUrl, durationSec, transcript }] }
        : m,
    )

    const submissionMessage = buildSubmissionMessage('', processed.ready)
    const assistantId = `assistant_${Date.now()}`
    let accumulated = ''
    sessionMessages.value = [
      ...sessionMessages.value,
      { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
    ]
    for await (const chunk of apiClient.sendPortalMessageStream({
      sessionId: resolvedSessionId,
      clientId: resolvedClientId,
      message: submissionMessage,
      provider: 'openai',
    })) {
      if (chunk.error) throw new Error(chunk.error)
      if (chunk.token) {
        accumulated += chunk.token
        streaming.value = true
        sessionMessages.value = sessionMessages.value.map((m) =>
          m.id === assistantId ? { ...m, content: accumulated } : m,
        )
        scrollToBottom('smooth')
      }
      if (chunk.done && chunk.message) {
        sessionMessages.value = sessionMessages.value.map((m) =>
          m.id === assistantId ? chunk.message! : m,
        )
        if (chunk.snapshotDelta) applySnapshotDelta(chunk.snapshotDelta)
      }
    }
  } catch (err) {
    loadError.value =
      err instanceof Error ? err.message : 'Voice message could not be sent. Please try again.'
    sessionMessages.value = sessionMessages.value.map((m) =>
      m.id === tempId ? { ...m, failed: true } : m,
    )
  } finally {
    sending.value = false
    streaming.value = false
  }
}

function handleWidgetRespond(messageId: string, value: string | number) {
  sessionMessages.value = sessionMessages.value.map((msg) =>
    msg.id === messageId ? { ...msg, widget_response: value } : msg,
  )
  apiClient.persistWidgetResponse(messageId, value).catch(console.error)
}

async function sendMessage() {
  if ((!draft.value.trim() && attachments.value.length === 0) || sending.value || streaming.value) return
  loadError.value = ''
  sending.value = true
  showWelcome.value = false
  const messageText = draft.value.trim()
  const queuedAttachments = attachments.value
    .filter((attachment): attachment is { name: string; type: 'file'; file: File } =>
      attachment.type === 'file' && attachment.file instanceof File,
    )
  const tempId = `user_${Date.now()}`
  draft.value = ''
  scrollToBottom('instant')
  sessionMessages.value = [
    ...sessionMessages.value,
    {
      id: tempId,
      role: 'client',
      content: messageText,
      createdAt: new Date().toISOString(),
      attachments: queuedAttachments.map((a) => ({ type: 'document' as const, name: a.name, mime: a.file.type })),
    },
  ]
  try {
    const readySeeds = await uploadAndProcessAttachments(
      queuedAttachments.map((attachment) => ({
        name: attachment.name,
        file: attachment.file,
      })),
    )
    const submissionMessage = buildSubmissionMessage(messageText, readySeeds)
    attachments.value = []

    const assistantId = `assistant_${Date.now()}`
    let accumulated = ''
    sessionMessages.value = [
      ...sessionMessages.value,
      { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
    ]
    for await (const chunk of apiClient.sendPortalMessageStream({
      sessionId: resolvedSessionId,
      clientId: resolvedClientId,
      message: submissionMessage,
      provider: 'openai',
    })) {
      if (chunk.error) throw new Error(chunk.error)
      if (chunk.token) {
        accumulated += chunk.token
        streaming.value = true
        sessionMessages.value = sessionMessages.value.map((m) =>
          m.id === assistantId ? { ...m, content: accumulated } : m,
        )
        scrollToBottom('smooth')
      }
      if (chunk.done && chunk.message) {
        sessionMessages.value = sessionMessages.value.map((m) =>
          m.id === assistantId ? chunk.message! : m,
        )
        if (chunk.snapshotDelta) applySnapshotDelta(chunk.snapshotDelta)
      }
    }
  } catch (err) {
    loadError.value =
      err instanceof Error ? err.message : 'Message could not be sent. Please try again.'
    sessionMessages.value = sessionMessages.value.map((m) =>
      m.id === tempId ? { ...m, failed: true } : m,
    )
  } finally {
    sending.value = false
    streaming.value = false
  }
}

async function handleSignOut(): Promise<void> {
  try {
    await auth.signOut()
    await router.replace({ name: 'portal-login' })
  } catch {
    loadError.value = 'Unable to sign out right now. Please try again.'
  }
}

function retryMessage(messageId: string) {
  const message = sessionMessages.value.find((m) => m.id === messageId)
  if (!message) return
  sessionMessages.value = sessionMessages.value.filter((m) => m.id !== messageId)
  draft.value = message.content
  sendMessage()
}

async function handleBriefApprove(briefId: string) {
  try {
    await apiClient.approveBrief(briefId)
    if (clientBrief.value?.id === briefId) {
      clientBrief.value = { ...clientBrief.value, status: 'client_approved' }
    }
  } catch {
    // Non-fatal — approval will be retried on next page load
  }
}
</script>
