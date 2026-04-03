<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ScalePayload } from '@/contracts/api'

const props = defineProps<{
  payload: ScalePayload
  disabled: boolean
  initialValue?: string | number
}>()

const emit = defineEmits<{ respond: [value: number] }>()

const currentValue = ref(props.initialValue != null ? Number(props.initialValue) : props.payload.min)
const confirmed = ref(props.initialValue != null)

watch(
  () => props.initialValue,
  (val) => {
    if (val != null) {
      currentValue.value = Number(val)
      confirmed.value = true
    }
  },
)

const thumbPercent = computed(() => {
  const range = props.payload.max - props.payload.min
  const pct = range === 0 ? 0 : ((currentValue.value - props.payload.min) / range) * 100
  return `calc(${pct}% + ${(0.5 - pct / 100) * 20}px)`
})

const displayValue = computed(() =>
  props.payload.unit ? `${currentValue.value}${props.payload.unit}` : String(currentValue.value),
)

function onInput(e: Event) {
  currentValue.value = Number((e.target as HTMLInputElement).value)
}

function confirm() {
  confirmed.value = true
  emit('respond', currentValue.value)
}
</script>

<template>
  <div class="mt-2 flex flex-col gap-3">
    <p class="text-xs text-base-content/60">{{ payload.prompt }}</p>

    <div class="relative pt-8">
      <!-- value pill above the thumb -->
      <div class="pointer-events-none absolute top-0 flex" :style="{ left: thumbPercent }">
        <span class="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white -translate-x-1/2">
          {{ displayValue }}
        </span>
      </div>

      <!-- range input -->
      <input
        type="range"
        class="slider-input w-full"
        :min="payload.min"
        :max="payload.max"
        :step="payload.step"
        :value="currentValue"
        :disabled="disabled || confirmed"
        :aria-label="payload.prompt"
        :aria-valuemin="payload.min"
        :aria-valuemax="payload.max"
        :aria-valuenow="currentValue"
        :aria-valuetext="displayValue"
        @input="onInput"
      />
    </div>

    <!-- min/max labels -->
    <div class="flex justify-between text-xs text-base-content/50">
      <span>{{ payload.minLabel }}</span>
      <span>{{ payload.maxLabel }}</span>
    </div>

    <!-- confirm button -->
    <button
      v-if="!disabled && !confirmed"
      type="button"
      class="self-start rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      @click="confirm"
    >
      Confirm
    </button>

    <!-- locked display -->
    <p v-else-if="disabled || confirmed" class="text-xs text-base-content/50">
      Selected: <span class="font-semibold text-base-content">{{ displayValue }}</span>
    </p>
  </div>
</template>

<style scoped>
.slider-input {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--color-base-300);
  outline: none;
  cursor: pointer;
}

.slider-input:disabled {
  cursor: default;
  opacity: 0.6;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b9bff, #6f63ff);
  box-shadow: 0 0 10px rgba(91, 108, 255, 0.4);
  cursor: pointer;
  transition: box-shadow 150ms ease;
}

.slider-input::-webkit-slider-thumb:hover {
  box-shadow: 0 0 16px rgba(91, 108, 255, 0.6);
}

.slider-input::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b9bff, #6f63ff);
  box-shadow: 0 0 10px rgba(91, 108, 255, 0.4);
  cursor: pointer;
}

.slider-input:disabled::-webkit-slider-thumb {
  box-shadow: none;
  opacity: 0.5;
}

.slider-input:disabled::-moz-range-thumb {
  box-shadow: none;
  opacity: 0.5;
}

@media (prefers-reduced-motion: reduce) {
  .slider-input::-webkit-slider-thumb {
    transition: none;
    box-shadow: 0 0 4px rgba(91, 108, 255, 0.3);
  }
}
</style>
