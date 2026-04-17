<template>
  <div :class="rowClass">
    <div
      v-if="showAvatar"
      class="aura-msg-avatar"
      :class="avatarClass"
      :aria-hidden="true"
    >
      <PhShieldStar v-if="message.role === 'operator'" :size="15" weight="fill" class="text-white" />
      <PhSparkle v-else :size="15" weight="fill" class="text-white" />
    </div>

    <div class="aura-msg-column" :class="columnClass">
      <article class="aura-msg-surface" :class="surfaceClass">
        <div v-if="message.role !== 'client'" class="aura-markdown prose prose-sm max-w-none" v-html="renderedHtml"></div>
        <template v-else>
          <div v-if="clientAttachments.length > 0" class="mb-2 flex flex-col gap-2">
            <MessageAudioPlayer
              v-for="(att, i) in clientAttachments.filter((a) => a.type === 'audio')"
              :key="`audio-${i}`"
              :preview-url="att.previewUrl"
              :duration-sec="att.durationSec"
              :transcript="att.transcript"
            />
            <MessageFileChip
              v-for="(att, i) in clientAttachments.filter((a) => a.type === 'document')"
              :key="`file-${i}`"
              :name="att.name"
              :mime="att.mime"
            />
          </div>
          <p v-if="displayContent">{{ displayContent }}</p>
        </template>

        <template v-if="props.message.widget_payload">
          <div class="mt-3">
            <ChoiceCard
              v-if="props.message.widget_payload.type === 'choices'"
              :payload="props.message.widget_payload"
              :disabled="props.message.widget_response !== undefined"
              :initial-value="props.message.widget_response"
              @respond="(value) => emit('widget-respond', props.message.id, value)"
            />
            <RatingSlider
              v-else-if="props.message.widget_payload.type === 'scale'"
              :payload="props.message.widget_payload"
              :disabled="props.message.widget_response !== undefined"
              :initial-value="props.message.widget_response"
              @respond="(value) => emit('widget-respond', props.message.id, value)"
            />
          </div>
        </template>
      </article>

      <span class="aura-msg-time" :class="timeClass">{{ formattedTime }}</span>
      <button
        v-if="message.failed"
        type="button"
        class="flex items-center gap-1 text-xs text-error/70 hover:text-error transition-colors mt-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-error/40"
        @click="emit('retry', message.id)"
      >
        <PhArrowClockwise :size="12" weight="bold" />
        <span>Retry</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MessageAttachment, ThreadMessage } from '@/contracts/api'
import { PhArrowClockwise, PhShieldStar, PhSparkle } from '@phosphor-icons/vue'
import ChoiceCard from '@/components/chat/widgets/ChoiceCard.vue'
import RatingSlider from '@/components/chat/widgets/RatingSlider.vue'
import MessageFileChip from '@/components/system/MessageFileChip.vue'
import MessageAudioPlayer from '@/components/system/MessageAudioPlayer.vue'
import { renderMarkdown } from '@/lib/markdown'

const props = defineProps<{
  message: ThreadMessage
}>()

const emit = defineEmits<{
  'widget-respond': [messageId: string, value: string | number]
  'retry': [messageId: string]
}>()

const rowClass = computed(() => {
  if (props.message.role === 'client') return 'aura-msg-row aura-msg-row--client'
  return 'aura-msg-row aura-msg-row--assistant'
})

const columnClass = computed(() => {
  if (props.message.role === 'client') return 'aura-msg-column--client'
  if (props.message.role === 'operator') return 'aura-msg-column--operator'
  return 'aura-msg-column--assistant'
})

const surfaceClass = computed(() => {
  if (props.message.role === 'assistant') return 'aura-msg-assistant-surface'
  if (props.message.role === 'operator') return 'aura-msg-operator-shell'
  return 'aura-msg-user-shell'
})

const timeClass = computed(() => {
  if (props.message.role === 'client') return 'aura-msg-time--client'
  if (props.message.role === 'operator') return 'aura-msg-time--operator'
  return 'aura-msg-time--assistant'
})

const showAvatar = computed(() => props.message.role === 'operator' || props.message.role === 'assistant')
const avatarClass = computed(() =>
  props.message.role === 'operator'
    ? 'bg-gradient-to-br from-info to-info/60'
    : 'bg-gradient-to-br from-primary to-primary/60'
)

const renderedHtml = computed(() =>
  props.message.role !== 'client' ? renderMarkdown(props.message.content) : ''
)

// --- Attachment rendering helpers for client messages ---

const AUDIO_PATTERN = /^I've sent (?:a voice note|voice notes and files) \("([^"]+)"\)/
const DOC_PATTERN = /Use the newly uploaded sources? "([^"]+(?:, "[^"]+)*)"(?: and "([^"]+)")? in your response/

function parseHistoricalAttachments(content: string): MessageAttachment[] {
  const audioMatch = AUDIO_PATTERN.exec(content)
  if (audioMatch) {
    return [{ type: 'audio', name: audioMatch[1] ?? 'Voice note' }]
  }
  const docMatch = DOC_PATTERN.exec(content)
  if (docMatch) {
    const titles = content.match(/"([^"]+)"/g)?.map((t) => t.slice(1, -1)) ?? []
    return titles.map((name) => ({ type: 'document' as const, name }))
  }
  return []
}

const clientAttachments = computed<MessageAttachment[]>(() => {
  if (props.message.role !== 'client') return []
  if (props.message.attachments && props.message.attachments.length > 0) {
    return props.message.attachments
  }
  return parseHistoricalAttachments(props.message.content)
})

const displayContent = computed(() => {
  if (props.message.role !== 'client') return props.message.content
  if (props.message.attachments !== undefined) {
    return props.message.content
  }
  // Historical: strip the injected instruction suffix so only the user's typed text remains
  const content = props.message.content
  const audioIdx = content.indexOf("\n\nI've sent ")
  if (audioIdx !== -1) return content.slice(0, audioIdx).trim()
  const docIdx = content.indexOf('\n\nUse the newly uploaded')
  if (docIdx !== -1) return content.slice(0, docIdx).trim()
  // If the whole message IS an instruction (no user text prefix), hide it when we have chips
  if (clientAttachments.value.length > 0 && (AUDIO_PATTERN.test(content) || DOC_PATTERN.test(content))) {
    return ''
  }
  return content
})

const formattedTime = computed(() => {
  const d = new Date(props.message.createdAt)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60_000)

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (sameDay(d, now)) {
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin} min ago`
    return time
  }
  if (sameDay(d, yesterday)) return `Yesterday ${time}`

  const month = d.toLocaleString([], { month: 'short' })
  return `${month} ${d.getDate()} ${time}`
})
</script>
