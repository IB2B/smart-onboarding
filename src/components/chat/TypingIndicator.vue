<template>
  <div
    class="flex items-start gap-3"
    role="status"
    aria-label="Assistant is typing"
  >
    <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <PhSparkle :size="14" weight="fill" />
    </div>
    <div class="inline-flex items-center gap-1 rounded-2xl border border-base-300 bg-base-100 px-4 py-3">
      <span class="typing-dot" aria-hidden="true" />
      <span class="typing-dot [animation-delay:0.2s]" aria-hidden="true" />
      <span class="typing-dot [animation-delay:0.4s]" aria-hidden="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhSparkle } from '@phosphor-icons/vue'
</script>
