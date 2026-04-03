<template>
  <div class="mt-2 flex flex-col gap-3">
    <p class="text-xs text-base-content/60">{{ payload.prompt }}</p>

    <div class="grid grid-cols-2 gap-2" role="radiogroup" :aria-label="payload.prompt">
      <button
        v-for="option in payload.options"
        :key="option.id"
        type="button"
        role="radio"
        :aria-checked="selectedId === option.id"
        :disabled="disabled || !!selectedId"
        :aria-disabled="disabled || !!selectedId"
        class="choice-card rounded-xl border border-base-300 bg-base-100 p-3 text-left text-sm transition-all duration-150"
        :class="[
          selectedId === option.id
            ? 'border-primary bg-primary/5 shadow-[0_0_12px_rgba(91,108,255,0.2)]'
            : selectedId
              ? 'opacity-40'
              : 'hover:border-primary/40 hover:shadow-[0_0_12px_rgba(91,108,255,0.15)]',
          disabled || !!selectedId ? 'pointer-events-none' : '',
        ]"
        @click="select(option.id)"
      >
        <span class="flex items-start justify-between gap-1">
          <span class="font-medium text-sm">{{ option.label }}</span>
          <PhCheckCircle
            v-if="selectedId === option.id"
            :size="14"
            weight="fill"
            class="text-primary mt-0.5 shrink-0"
          />
        </span>
        <p v-if="option.description" class="text-xs text-base-content/50 mt-0.5">
          {{ option.description }}
        </p>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { PhCheckCircle } from '@phosphor-icons/vue'
import type { ChoicesPayload } from '@/contracts/api'

const props = defineProps<{
  payload: ChoicesPayload
  disabled: boolean
  initialValue?: string | number
}>()

const emit = defineEmits<{
  respond: [value: string]
}>()

const selectedId = ref(props.initialValue != null ? String(props.initialValue) : '')

watch(
  () => props.initialValue,
  (val) => {
    if (val != null) selectedId.value = String(val)
  },
)

function select(id: string) {
  if (props.disabled || selectedId.value) return
  selectedId.value = id
  emit('respond', id)
}
</script>
