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
        <p v-else>{{ message.content }}</p>

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
import type { ThreadMessage } from '@/contracts/api'
import { PhArrowClockwise, PhShieldStar, PhSparkle } from '@phosphor-icons/vue'
import ChoiceCard from '@/components/chat/widgets/ChoiceCard.vue'
import RatingSlider from '@/components/chat/widgets/RatingSlider.vue'
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
