<script setup lang="ts">
import { PhArrowClockwise, PhChatTeardropText, PhLockSimple, PhUserPlus } from '@phosphor-icons/vue'

defineProps<{ blockedCount: number; loading?: boolean }>()
defineEmits<{
  invite: []
  'review-blocked': []
  'open-chat': []
  refresh: []
}>()
</script>

<template>
  <article class="rounded-2xl border border-base-300/80 bg-base-100 p-4">
    <header class="mb-3 flex items-center justify-between gap-3">
      <h3 class="aura-heading text-base font-semibold">Quick Actions</h3>
      <span class="text-xs text-base-content/55">Shortcuts</span>
    </header>

    <div class="grid grid-cols-2 gap-2.5">
      <!-- Invite Client — primary toned -->
      <button type="button"
        class="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10
               px-3 py-3 text-sm font-medium text-primary transition-all
               hover:bg-primary/15 active:scale-[0.98] focus-visible:outline-none
               focus-visible:ring-2 focus-visible:ring-primary/40"
        @click="$emit('invite')">
        <PhUserPlus :size="16" weight="fill" class="shrink-0" />
        Invite Client
      </button>

      <!-- Review Blocked — error toned -->
      <button type="button"
        class="flex items-center gap-2 rounded-xl border border-error/25 bg-error/10
               px-3 py-3 text-sm font-medium text-error-content transition-all
               hover:bg-error/15 active:scale-[0.98] focus-visible:outline-none
               focus-visible:ring-2 focus-visible:ring-error/40"
        @click="$emit('review-blocked')">
        <PhLockSimple :size="16" weight="fill" class="shrink-0" />
        <span class="truncate">Review Blocked</span>
        <span v-if="blockedCount > 0"
          class="ml-auto shrink-0 rounded-full bg-error/25 px-1.5 py-0.5 text-[10px] font-semibold">
          {{ blockedCount }}
        </span>
      </button>

      <!-- Open Client Chat — neutral -->
      <button type="button"
        class="flex items-center gap-2 rounded-xl border border-base-300/80 bg-base-200/60
               px-3 py-3 text-sm font-medium text-base-content transition-all
               hover:bg-base-200/90 active:scale-[0.98] focus-visible:outline-none
               focus-visible:ring-2 focus-visible:ring-base-300"
        @click="$emit('open-chat')">
        <PhChatTeardropText :size="16" weight="fill" class="shrink-0" />
        Open Chat
      </button>

      <!-- Refresh Data — neutral, spins when loading -->
      <button type="button"
        :disabled="loading"
        class="flex items-center gap-2 rounded-xl border border-base-300/80 bg-base-200/60
               px-3 py-3 text-sm font-medium text-base-content transition-all
               hover:bg-base-200/90 active:scale-[0.98] focus-visible:outline-none
               focus-visible:ring-2 focus-visible:ring-base-300
               disabled:opacity-50 disabled:cursor-not-allowed"
        @click="$emit('refresh')">
        <PhArrowClockwise :size="16" weight="fill" class="shrink-0"
          :class="loading ? 'animate-spin' : ''" />
        Refresh Data
      </button>
    </div>
  </article>
</template>
