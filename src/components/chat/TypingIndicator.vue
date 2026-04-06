<template>
  <div
    class="aura-msg-row aura-msg-row--assistant"
    role="status"
    aria-label="Assistant is typing"
  >
    <div class="aura-msg-column aura-msg-column--assistant">
      <div class="aura-typing-inline">
        <PhSparkle :size="13" weight="fill" class="text-primary/60" />
        <span class="typing-dot" aria-hidden="true" />
        <span class="typing-dot [animation-delay:0.2s]" aria-hidden="true" />
        <span class="typing-dot [animation-delay:0.4s]" aria-hidden="true" />
      </div>
      <span class="aura-msg-time aura-msg-time--assistant">typing...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhSparkle } from '@phosphor-icons/vue'
</script>
