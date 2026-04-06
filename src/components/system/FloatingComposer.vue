<template>
  <form
    class="rounded-[10px] border border-base-300/70 bg-base-200/70 p-[6px]"
    @submit.prevent="handleSubmit"
  >
    <div class="mb-[5px] flex flex-wrap items-center gap-[5px]">
      <span class="inline-flex h-[30px] items-center gap-[6px] rounded-[6px] border border-black/5 bg-base-100 px-[10px] text-[13px] font-medium tracking-[-0.04em] text-black/50">
        <PhFileText :size="16" />
        Contract.md
        <PhX :size="14" class="opacity-70" />
      </span>
      <span class="inline-flex h-[30px] items-center gap-[6px] rounded-[6px] border border-black/5 bg-base-100 px-[10px] text-[13px] font-medium tracking-[-0.04em] text-black/50">
        <PhImage :size="16" />
        Profile-picture.png
        <PhX :size="14" class="opacity-70" />
      </span>
    </div>

    <div class="rounded-[10px] bg-base-100 px-[14px] py-[8px]">
      <label class="sr-only" :for="inputId">{{ label }}</label>
      <textarea
        :id="inputId"
        ref="textareaRef"
        rows="1"
        :value="modelValue"
        class="min-h-[22px] w-full resize-none bg-transparent text-[14px] font-medium leading-[1.21] tracking-[-0.04em] text-[#0a0a0a]/70 placeholder:text-[#0a0a0a]/50 focus:outline-none"
        :placeholder="placeholder"
        style="max-height: 7.5rem; overflow-y: auto;"
        @input="onInput"
        @keydown="onKeydown"
      />

      <div class="mt-[14px] flex items-center justify-between gap-3">
        <button
          type="button"
          class="inline-flex h-[28px] items-center gap-[5px] rounded-[6px] border border-black/5 bg-base-200 px-3 text-[12px] font-medium tracking-[-0.04em] text-[#191b1dcc] transition-colors hover:bg-base-300/60"
          aria-label="Attach"
          @click="$emit('attach')"
        >
          <PhPaperclip :size="14" weight="regular" />
          Attachment
        </button>

        <div class="flex items-center gap-[10px]">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-md text-black/50 hover:bg-base-200 transition-colors"
            aria-label="Voice input"
          >
            <PhMicrophone :size="15" weight="regular" />
          </button>

          <button
            class="btn btn-primary btn-sm aura-action-label h-[30px] min-h-[30px] gap-[6px] rounded-[5px] border-0 px-3 text-[13px] disabled:opacity-45"
            type="submit"
            :disabled="!modelValue.trim()"
          >
            <PhPaperPlaneRight :size="16" />
            Send
            <span class="inline-flex items-center gap-1.5 rounded-[2px] bg-base-100/20 px-[5px] py-[1px] text-[10px] leading-none">
              <span aria-hidden="true">⌘</span>
              <span>Enter</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { nextTick, ref, useId, watch } from 'vue'
import {
  PhFileText,
  PhImage,
  PhMicrophone,
  PhPaperclip,
  PhPaperPlaneRight,
  PhX,
} from '@phosphor-icons/vue'

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
