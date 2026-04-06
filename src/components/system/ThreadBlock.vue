<template>
  <div :class="rowClass">
    <div
      v-if="showAvatar"
      class="aura-msg-avatar"
      :class="avatarClass"
      :aria-hidden="true"
    >
      <PhShieldStar :size="15" weight="fill" class="text-white" />
    </div>

    <div class="aura-msg-column" :class="columnClass">
      <article class="aura-msg-surface" :class="surfaceClass">
        <p>{{ message.content }}</p>

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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ThreadMessage } from '@/contracts/api'
import { PhShieldStar } from '@phosphor-icons/vue'
import ChoiceCard from '@/components/chat/widgets/ChoiceCard.vue'
import RatingSlider from '@/components/chat/widgets/RatingSlider.vue'

const props = defineProps<{
  message: ThreadMessage
}>()

const emit = defineEmits<{
  'widget-respond': [messageId: string, value: string | number]
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

const showAvatar = computed(() => props.message.role === 'operator')
const avatarClass = computed(() => 'bg-gradient-to-br from-info to-info/60')

const formattedTime = computed(() => {
  const d = new Date(props.message.createdAt)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})
</script>
