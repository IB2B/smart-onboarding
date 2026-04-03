<template>
  <AppShell
    :theme="store.decision.themeId"
    :font-pair-id="store.decision.fontPairId"
    :icon-pack-id="store.decision.iconPackId"
    :density="store.decision.density"
  >
    <template #sidebarHeader>
      <AuraLogo brand-name="AURA" />
    </template>

    <template #sidebar="{ collapsed }">
      <template v-if="!collapsed">
        <button
          type="button"
          class="mt-4 flex w-full items-center gap-2 rounded-xl border border-[#e8ebf3] bg-white px-3 py-2 text-slate-400 hover:bg-slate-50"
          @click="spotlightOpen = true"
        >
          <PhMagnifyingGlass :size="16" />
          <span class="flex-1 text-left text-sm">Search</span>
          <kbd class="rounded border border-[#e1e5ee] bg-[#f4f6fb] px-1 py-0.5 text-[10px] text-[#7d73ff]">⌘K</kbd>
        </button>
      </template>
      <template v-else>
        <div class="mt-4 flex justify-center">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-base-300/50"
            aria-label="Search"
            @click="spotlightOpen = true"
          >
            <PhMagnifyingGlass :size="18" />
          </button>
        </div>
      </template>

      <nav class="mt-4 flex flex-col gap-0.5">
        <button
          v-for="item in navItems"
          :key="item.label"
          type="button"
          :class="collapsed
            ? 'flex w-full items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-[#f4f6fb] cursor-pointer transition-colors duration-150'
            : 'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[14px] text-slate-600 hover:bg-[#f4f6fb] cursor-pointer transition-colors duration-150'"
          :title="collapsed ? item.label : undefined"
          :aria-label="collapsed ? item.label : undefined"
        >
          <component :is="item.icon" :size="18" />
          <span v-if="!collapsed">{{ item.label }}</span>
        </button>
      </nav>

      <template v-if="!collapsed">
        <div class="mt-6 space-y-4">
          <div>
            <p class="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">Tomorrow</p>
            <button
              v-for="item in tomorrowPrompts"
              :key="item"
              type="button"
              class="w-full truncate rounded-lg px-3 py-1.5 text-left text-[13px] text-slate-500 hover:bg-[#f4f6fb] cursor-pointer transition-colors duration-150"
            >{{ item }}</button>
          </div>
          <div>
            <p class="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">7 Days Ago</p>
            <button
              v-for="item in olderPrompts"
              :key="item"
              type="button"
              class="w-full truncate rounded-lg px-3 py-1.5 text-left text-[13px] text-slate-500 hover:bg-[#f4f6fb] cursor-pointer transition-colors duration-150"
            >{{ item }}</button>
          </div>
        </div>
      </template>

      <ProfileDock detail="judha.design@gmail.com" name="Judha Magyusta" />
    </template>

    <div class="flex h-full flex-col">
      <header class="mb-2 flex items-center justify-end pb-1">
        <button
          type="button"
          class="rounded-lg bg-[#5b6cff] px-4 py-2 text-sm font-medium text-white hover:bg-[#4a5be8] cursor-pointer transition-colors duration-150"
        >
          + New Chat
        </button>
      </header>

      <div class="flex flex-1 flex-col overflow-hidden">
        <Transition name="fade" mode="out-in">
          <!-- LOADING STATE -->
          <div v-if="loading" key="loading" class="flex flex-col gap-4 p-6">
            <SkeletonBlock variant="assistant" :lines="2" />
            <SkeletonBlock variant="client" :lines="1" />
            <SkeletonBlock variant="assistant" :lines="3" />
          </div>

          <!-- WELCOME STATE: no messages -->
          <div v-else-if="sessionMessages.length === 0" key="welcome" class="flex flex-1 flex-col items-center justify-center px-4">
            <div class="relative flex items-center justify-center">
              <div class="absolute h-24 w-24 rounded-full bg-[#5b6cff]/20 blur-xl orb-glow" />
              <div class="relative h-20 w-20 rounded-full orb" />
            </div>
            <h1 class="aura-heading mt-5 text-center text-[44px] font-bold leading-[1.15] tracking-[-0.01em] text-[#242732]">
              Good Morning, Judha<br />
              <span class="bg-gradient-to-r from-[#5b6cff] to-[#7ca6ff] bg-clip-text text-transparent">
                How Can I Assist You Today?
              </span>
            </h1>
            <div class="mt-9 w-full max-w-[930px]">
              <FloatingComposer
                v-model="draft"
                label="Message composer"
                placeholder="Initiate a query or send a command to the AI..."
                @submit="sendMessage"
              />
            </div>
          </div>

          <!-- CONVERSATION STATE: has messages -->
          <div v-else key="conversation" class="flex flex-1 flex-col overflow-hidden">
            <div class="flex-1 overflow-y-auto px-4 py-4">
              <div class="mx-auto w-full max-w-[920px] space-y-4" aria-live="polite">
                <ThreadBlock
                  v-for="message in sessionMessages"
                  :key="message.id"
                  :message="message"
                  @widget-respond="handleWidgetRespond"
                />
                <Transition name="fade">
                  <TypingIndicator v-if="sending" />
                </Transition>
              </div>
            </div>
            <div class="shrink-0 px-4 pb-4">
              <div class="mx-auto w-full max-w-[930px]">
                <FloatingComposer
                  v-model="draft"
                  label="Message composer"
                  placeholder="Initiate a query or send a command to the AI..."
                  @submit="sendMessage"
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
    <SpotlightSearch :open="spotlightOpen" @close="spotlightOpen = false" />
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PhBookOpenText, PhClockCounterClockwise, PhCompass, PhHouse, PhMagnifyingGlass } from '@phosphor-icons/vue'

import { apiClient } from '@/services/api-client'
import AuraLogo from '@/components/system/AuraLogo.vue'
import AppShell from '@/components/system/AppShell.vue'
import FloatingComposer from '@/components/system/FloatingComposer.vue'
import ProfileDock from '@/components/system/ProfileDock.vue'
import SpotlightSearch from '@/components/system/SpotlightSearch.vue'
import SkeletonBlock from '@/components/system/SkeletonBlock.vue'
import ThreadBlock from '@/components/system/ThreadBlock.vue'
import TypingIndicator from '@/components/chat/TypingIndicator.vue'
import type { ThreadMessage } from '@/contracts/api'
import { useSpecLabStore } from '@/stores/spec-lab'
import { useHotkey } from '@/composables/useHotkey'

const MOCK_SESSION_ID = 'session-demo'
const MOCK_CLIENT_ID = 'cl_1'

const store = useSpecLabStore()
const route = useRoute()
const draft = ref('')
const spotlightOpen = ref(false)

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
const navItems = [
  { label: 'Home', icon: PhHouse },
  { label: 'Explore', icon: PhCompass },
  { label: 'Library', icon: PhBookOpenText },
  { label: 'History', icon: PhClockCounterClockwise },
]
const tomorrowPrompts = [
  "What's something you've learne...",
  'If you could teleport anywhere...',
  "What's one goal you want to ac...",
]
const olderPrompts = ['Ask me anything weird or rand...', 'How are you feeling today, reall...', "What's one habit you wish you..."]

function normalizeToken(raw: unknown): string | undefined {
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0]
  return undefined
}

onMounted(async () => {
  try {
    const session = await apiClient.getPortalSession(normalizeToken(route.params.magicToken))
    sessionMessages.value = [...session.session.messages]
  } catch {
    loadError.value = 'Unable to load the session right now. Please retry.'
  } finally {
    loading.value = false
  }
})

function handleWidgetRespond(messageId: string, value: string | number) {
  sessionMessages.value = sessionMessages.value.map((msg) =>
    msg.id === messageId ? { ...msg, widget_response: value } : msg,
  )
}

async function sendMessage() {
  if (!draft.value.trim() || sending.value) return
  loadError.value = ''
  sending.value = true
  const messageText = draft.value
  draft.value = ''
  sessionMessages.value = [
    ...sessionMessages.value,
    { id: `user_${Date.now()}`, role: 'client', content: messageText, createdAt: new Date().toISOString() },
  ]
  try {
    const response = await apiClient.sendPortalMessage({
      sessionId: MOCK_SESSION_ID,
      clientId: MOCK_CLIENT_ID,
      message: messageText,
      provider: 'openrouter',
      token: normalizeToken(route.params.magicToken),
    })
    sessionMessages.value = [...sessionMessages.value, response.message]
  } catch {
    loadError.value = 'Message could not be sent. Please try again.'
  } finally {
    sending.value = false
  }
}
</script>
