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
          class="mt-4 flex w-full items-center gap-2 rounded-xl border border-[#e8ebf3] bg-white px-3 py-2 text-slate-400 hover:bg-slate-50"
          @click="spotlightOpen = true"
        >
          <PhMagnifyingGlass :size="16" />
          <span class="flex-1 text-left text-sm font-medium tracking-[-0.01em]">Search</span>
          <kbd class="inline-flex items-center gap-1.5 rounded border border-[#e1e5ee] bg-[#f4f6fb] px-1.5 py-0.5 text-[10px] text-[#7d73ff]">
            <span aria-hidden="true">⌘</span>
            <span>K</span>
          </kbd>
        </button>

        <!-- Nav items -->
        <nav class="mt-3 flex flex-col gap-0.5">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium text-slate-600 hover:bg-base-300/50 transition-colors duration-100"
          >
            <PhClockCounterClockwise :size="17" />
            <span>History</span>
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium text-slate-600 hover:bg-base-300/50 transition-colors duration-100"
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
            class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-base-300/50"
            aria-label="Search"
            @click="spotlightOpen = true"
          >
            <PhMagnifyingGlass :size="18" />
          </button>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-base-300/50"
            aria-label="History"
          >
            <PhClockCounterClockwise :size="18" />
          </button>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-base-300/50"
            aria-label="Documents"
          >
            <PhFile :size="18" />
          </button>
        </div>
      </template>

      <ProfileDock :detail="auth.userEmail ?? ''" :name="clientName || (auth.userEmail ?? '')" />
    </template>

    <template #default="{ collapsed, toggle }">
      <div class="flex h-full flex-col">
      <header class="-mx-3 -mt-3 mb-4 border-b border-[#e4e4e4] px-4 py-[10px] md:-mx-6 md:-mt-6 md:px-[15px]">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center text-[#0a0a0a]">
            <button
              type="button"
              class="mr-[6px] flex h-8 w-8 items-center justify-center rounded-[5px] text-[#0a0a0a] hover:bg-black/[0.03] transition-colors duration-150"
              aria-label="Toggle sidebar"
              :aria-expanded="!collapsed"
              @click="toggle"
            >
              <PhSidebarSimple :size="18" />
            </button>
            <span class="mr-[6px] h-3 w-px bg-[#0a0a0a]/40" aria-hidden="true" />
            <p class="aura-topbar-title text-[14px] tracking-[-0.04em]">Smart Onboarding</p>
          </div>
          <!-- Center: milestone progress bar -->
          <div class="flex flex-1 justify-center">
            <PortalProgressBar :onboarding-state="onboardingState" />
          </div>
        </div>
      </header>

      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- POST-ONBOARDING: review / complete state -->
        <PostOnboardingView
          v-if="isPostOnboarding && !loading && onboardingState"
          :onboarding-state="onboardingState"
          :brief="clientBrief"
          :brief-loading="briefLoading"
          @approve="handleBriefApprove"
        />

        <Transition v-else name="fade" mode="out-in">
          <!-- LOADING STATE -->
          <div v-if="loading" key="loading" class="flex flex-col gap-4 p-6">
            <SkeletonBlock variant="assistant" :lines="2" />
            <SkeletonBlock variant="client" :lines="1" />
            <SkeletonBlock variant="assistant" :lines="3" />
          </div>

          <!-- WELCOME STATE: no messages -->
          <div v-else-if="showWelcome" key="welcome" class="flex flex-1 flex-col items-center justify-center px-4">
            <div class="relative flex items-center justify-center">
              <div class="absolute h-24 w-24 rounded-full bg-[#5b6cff]/20 blur-xl orb-glow" />
              <div class="relative h-20 w-20 rounded-full orb" />
            </div>
            <h1 class="aura-heading mt-5 text-center text-[28px] font-medium leading-[1.2] tracking-[-0.04em] text-[#0a0a0a]">
              Welcome back,
              <span class="aura-hero-emphasis">
                {{ clientName || 'there' }}!
              </span>
            </h1>
            <p class="mt-[10px] max-w-[421px] text-center text-[14px] font-medium leading-[1.22] tracking-[-0.04em] text-[#0a0a0a99]">
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
                  <TypingIndicator v-if="sending" :label="'Thinking…'" />
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
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { uploadAudioBlob } from '@/lib/audio-upload'
import {
  PhArrowDown,
  PhClockCounterClockwise,
  PhFile,
  PhMagnifyingGlass,
  PhSidebarSimple,
} from '@phosphor-icons/vue'

import { apiClient } from '@/services/api-client'
import { useAuthStore } from '@/stores/auth'
import AuraLogo from '@/components/system/AuraLogo.vue'
import AppShell from '@/components/system/AppShell.vue'
import FloatingComposer from '@/components/system/FloatingComposer.vue'
import ProfileDock from '@/components/system/ProfileDock.vue'
import SpotlightSearch from '@/components/system/SpotlightSearch.vue'
import SkeletonBlock from '@/components/system/SkeletonBlock.vue'
import ThreadBlock from '@/components/system/ThreadBlock.vue'
import TypingIndicator from '@/components/chat/TypingIndicator.vue'
import PortalProgressBar from '@/components/portal/PortalProgressBar.vue'
import PostOnboardingView from '@/components/portal/PostOnboardingView.vue'
import type { OnboardingBrief, OnboardingState, ThreadMessage } from '@/contracts/api'
import { useSpecLabStore } from '@/stores/spec-lab'
import { useHotkey } from '@/composables/useHotkey'
import { useAutoScroll } from '@/composables/useAutoScroll'

const store = useSpecLabStore()
const auth = useAuthStore()
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
const loadError = ref('')
const loading = ref(true)
const showWelcome = ref(true)
const clientName = ref('')
const clientCompany = ref('')
const onboardingState = ref<OnboardingState | null>(null)
const clientBrief = ref<OnboardingBrief | null>(null)
const briefLoading = ref(false)
let briefPollTimer: ReturnType<typeof setTimeout> | null = null
let briefPollAttempts = 0
const BRIEF_MAX_POLL_ATTEMPTS = 40 // ~2 min at 3s intervals

const isPostOnboarding = computed(
  () => onboardingState.value?.phase === 'review' || onboardingState.value?.phase === 'complete',
)

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
    onboardingState.value = session.onboardingState
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

function applySnapshotDelta(delta: Partial<{ phase?: string; milestones?: Record<string, unknown> }>) {
  if (!delta.phase && !delta.milestones) return
  if (!onboardingState.value) return
  onboardingState.value = {
    ...onboardingState.value,
    ...(delta.phase ? { phase: delta.phase as OnboardingState['phase'] } : {}),
    ...(delta.milestones
      ? { milestones: { ...onboardingState.value.milestones, ...(delta.milestones as OnboardingState['milestones']) } }
      : {}),
  }
  if (delta.phase === 'review') {
    briefPollAttempts = 0
    loadClientBrief()
  }
}

async function handleSendAudio(blob: Blob): Promise<void> {
  if (!resolvedClientId || sending.value) return
  sending.value = true
  showWelcome.value = false
  try {
    await uploadAudioBlob(blob, resolvedClientId)
    // Send a fixed, non-interpolated message — storage path is handled server-side
    const response = await apiClient.sendPortalMessage({
      sessionId: resolvedSessionId,
      clientId: resolvedClientId,
      message: '[Voice message]',
      provider: 'openrouter',
    })
    sessionMessages.value = [...sessionMessages.value, response.message]
    applySnapshotDelta(response.snapshotDelta)
  } catch {
    loadError.value = 'Voice message could not be sent. Please try again.'
  } finally {
    sending.value = false
  }
}

function handleWidgetRespond(messageId: string, value: string | number) {
  sessionMessages.value = sessionMessages.value.map((msg) =>
    msg.id === messageId ? { ...msg, widget_response: value } : msg,
  )
  apiClient.persistWidgetResponse(messageId, value).catch(console.error)
}

async function sendMessage() {
  if (!draft.value.trim() || sending.value) return
  loadError.value = ''
  sending.value = true
  showWelcome.value = false
  const messageText = draft.value
  const tempId = `user_${Date.now()}`
  draft.value = ''
  scrollToBottom('instant')
  sessionMessages.value = [
    ...sessionMessages.value,
    { id: tempId, role: 'client', content: messageText, createdAt: new Date().toISOString() },
  ]
  try {
    for (const attachment of attachments.value) {
      if (attachment.file && resolvedClientId) {
        try {
          await apiClient.uploadSeedFile({
            clientId: resolvedClientId,
            file: attachment.file,
            title: attachment.name,
            sourceType: 'document',
          })
        } catch {
          loadError.value = `Could not upload "${attachment.name}". The message will still be sent.`
        }
      }
    }
    attachments.value = []

    const response = await apiClient.sendPortalMessage({
      sessionId: resolvedSessionId,
      clientId: resolvedClientId,
      message: messageText,
      provider: 'openrouter',
    })
    sessionMessages.value = [...sessionMessages.value, response.message]
    applySnapshotDelta(response.snapshotDelta)
  } catch {
    loadError.value = 'Message could not be sent. Please try again.'
    sessionMessages.value = sessionMessages.value.map((m) =>
      m.id === tempId ? { ...m, failed: true } : m,
    )
  } finally {
    sending.value = false
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
