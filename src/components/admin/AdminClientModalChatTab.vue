<template>
  <div class="flex flex-col gap-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <p class="text-sm font-semibold">Conversation</p>
      <span
        class="flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success-content"
      >
        <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
        Live
      </span>
    </div>

    <!-- Messages -->
    <div ref="scrollContainer" class="space-y-3 overflow-y-auto pr-1" :class="fullPage ? 'max-h-[calc(100vh-22rem)]' : 'max-h-[50vh]'">
      <template v-if="localMessages.length > 0">
        <ThreadBlock
          v-for="message in localMessages"
          :key="message.id"
          :message="message"
        />
      </template>
      <p v-else class="py-4 text-center text-xs text-base-content/60">No messages yet.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useAutoScroll } from '@/composables/useAutoScroll'
import { useMessageRealtime } from '@/composables/useMessageRealtime'
import ThreadBlock from '@/components/system/ThreadBlock.vue'
import type { ThreadMessage } from '@/contracts/api'

const props = defineProps<{
  messages: ThreadMessage[]
  clientId: string
  fullPage?: boolean
}>()

// Local copy that grows with realtime inserts
const localMessages = ref<ThreadMessage[]>([...props.messages])

// Sync when parent reloads
watch(
  () => props.messages,
  (msgs) => {
    localMessages.value = [...msgs]
  },
  { deep: true },
)

// Auto-scroll setup
const scrollContainer = ref<HTMLElement | null>(null)
const { scrollToBottom } = useAutoScroll(scrollContainer)

// Scroll to bottom whenever new messages arrive
watch(
  () => localMessages.value.length,
  async () => {
    await nextTick()
    scrollToBottom('smooth')
  },
)

// Realtime subscription
const clientIdRef = computed(() => props.clientId || null)
useMessageRealtime(clientIdRef, (msg: ThreadMessage) => {
  localMessages.value = [...localMessages.value, msg]
})
</script>
