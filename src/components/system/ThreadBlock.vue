<template>
  <div
    class="flex items-end gap-3"
    :class="message.role === 'client' ? 'flex-row-reverse' : 'flex-row'"
  >
    <!-- Avatar -->
    <div
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm"
      :class="
        message.role === 'assistant'
          ? 'bg-gradient-to-br from-[#5b6cff] to-[#8b9bff]'
          : message.role === 'operator'
            ? 'bg-gradient-to-br from-info to-info/60'
            : 'bg-gradient-to-br from-[#cad6ff] to-[#e7ecff]'
      "
      :aria-hidden="true"
    >
      <PhSparkle v-if="message.role === 'assistant'" :size="15" weight="fill" class="text-white" />
      <PhShieldStar v-else-if="message.role === 'operator'" :size="15" weight="fill" class="text-white" />
      <PhUser v-else :size="15" weight="fill" class="text-[#5b6cff]" />
    </div>

    <!-- Bubble + time -->
    <div
      class="flex max-w-[72%] flex-col gap-1"
      :class="message.role === 'client' ? 'items-end' : 'items-start'"
    >
      <article
        class="px-4 py-3 text-sm leading-relaxed shadow-sm"
        :class="bubbleClass"
      >
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

      <span class="px-1 text-[11px] text-base-content/40">{{ formattedTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ThreadMessage } from '@/contracts/api'
import { PhSparkle, PhShieldStar, PhUser } from '@phosphor-icons/vue'
import ChoiceCard from '@/components/chat/widgets/ChoiceCard.vue'
import RatingSlider from '@/components/chat/widgets/RatingSlider.vue'

const props = defineProps<{
  message: ThreadMessage
}>()

const emit = defineEmits<{
  'widget-respond': [messageId: string, value: string | number]
}>()

const bubbleClass = computed(() => {
  if (props.message.role === 'assistant') {
    return 'rounded-2xl rounded-bl-sm bg-white border border-base-300/60 text-slate-700'
  }
  if (props.message.role === 'operator') {
    return 'rounded-2xl rounded-bl-sm bg-info/15 border border-info/30 text-info-content'
  }
  // client — right side bubble
  return 'rounded-2xl rounded-br-sm bg-gradient-to-br from-[#5b6cff] to-[#6f7fff] text-white border border-transparent'
})

const formattedTime = computed(() => {
  const d = new Date(props.message.createdAt)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})
</script>
