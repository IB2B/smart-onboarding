<template>
  <div class="flex flex-col gap-1">
    <form
      class="flex items-end gap-2 rounded-2xl border border-[#e9ebf5] bg-white px-3 py-2 shadow-sm"
      @submit.prevent="handleSubmit"
    >
      <button
        type="button"
        class="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Attach"
        @click="$emit('attach')"
      >
        <PhPaperclip :size="16" weight="regular" />
      </button>

      <label class="sr-only" :for="inputId">{{ label }}</label>
      <textarea
        :id="inputId"
        ref="textareaRef"
        rows="1"
        :value="modelValue"
        class="min-w-0 flex-1 resize-none bg-transparent text-[15px] leading-6 text-slate-600 placeholder:text-slate-400 focus:outline-none"
        :placeholder="placeholder"
        style="max-height: 7.5rem; overflow-y: auto;"
        @input="onInput"
        @keydown="onKeydown"
      />

      <div class="mb-0.5 flex shrink-0 items-center gap-1">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Voice input"
        >
          <PhMicrophone :size="16" weight="regular" />
        </button>
        <button
          class="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b9bff,#6f63ff)] text-white transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
          type="submit"
          aria-label="Send"
          :disabled="!modelValue.trim()"
        >
          <PhArrowUp :size="14" weight="bold" />
        </button>
      </div>
    </form>
    <p class="px-3 text-[11px] text-slate-400">
      Press <kbd class="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[10px]">Shift+Enter</kbd> for a new line · <kbd class="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[10px]">/</kbd> for commands
    </p>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue'
import { PhArrowUp, PhMicrophone, PhPaperclip } from '@phosphor-icons/vue'

const props = defineProps<{
  modelValue: string
  placeholder: string
  label: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
  attach: []
}>()

const inputId = useId()
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`
}

function onInput(e: Event) {
  const value = (e.target as HTMLTextAreaElement).value
  emit('update:modelValue', value)
  nextTick(autoResize)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
}

function handleSubmit() {
  if (!props.modelValue.trim()) return
  emit('submit')
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    nextTick(() => {
      if (textareaRef.value) textareaRef.value.style.height = 'auto'
    })
  }
})
</script>
