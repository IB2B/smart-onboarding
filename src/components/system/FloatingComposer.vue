<template>
  <form
    class="rounded-[10px] border border-base-300/70 bg-base-200/70 p-[6px]"
    @submit.prevent="handleSubmit"
  >
    <!-- Attachment chips — only rendered when attachments exist -->
    <div v-if="attachments && attachments.length > 0" class="mb-[5px] flex flex-wrap items-center gap-[5px]">
      <span
        v-for="(attachment, index) in attachments"
        :key="index"
        class="inline-flex h-[30px] items-center gap-[6px] rounded-[6px] border border-black/5 bg-base-100 px-[10px] text-[13px] font-medium tracking-[-0.04em] text-black/50"
      >
        <PhFileText v-if="attachment.type === 'file'" :size="16" />
        <PhWaveform v-else-if="attachment.type === 'audio'" :size="16" />
        {{ attachment.name }}
        <button
          type="button"
          class="opacity-70 hover:opacity-100 transition-opacity"
          :aria-label="`Remove ${attachment.name}`"
          @click="emit('remove-attachment', index)"
        >
          <PhX :size="14" />
        </button>
      </span>
    </div>

    <div class="rounded-[10px] bg-base-100 px-[14px] py-[8px]">
      <label class="sr-only" :for="inputId">{{ label }}</label>
      <textarea
        :id="inputId"
        ref="textareaRef"
        rows="1"
        :value="modelValue"
        class="min-h-[22px] w-full resize-none bg-transparent text-[14px] font-medium leading-[1.21] tracking-[-0.04em] text-base-content/70 placeholder:text-base-content/50 focus:outline-none"
        :placeholder="placeholder"
        style="max-height: 7.5rem; overflow-y: auto;"
        @input="onInput"
        @keydown="onKeydown"
      />

      <!-- Audio preview row — State 3: recorded blob ready -->
      <div
        v-if="!recorder.isRecording.value && recorder.recordedBlob.value"
        class="mt-[10px] flex items-center gap-[8px] rounded-[6px] border border-black/5 bg-base-200 px-[10px] py-[6px]"
      >
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-md text-black/60 hover:bg-base-300/60 transition-colors"
          :aria-label="isPlayingPreview ? 'Pause preview' : 'Play preview'"
          @click="togglePreviewPlayback"
        >
          <PhPlay v-if="!isPlayingPreview" :size="14" weight="fill" />
          <PhPause v-else :size="14" weight="fill" />
        </button>
        <span class="flex-1 text-[12px] font-medium tracking-[-0.04em] text-black/50">Voice message</span>
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-md text-error/70 hover:bg-error/10 transition-colors"
          aria-label="Discard voice message"
          @click="discardAudio"
        >
          <PhTrash :size="14" />
        </button>
      </div>

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
          <!-- State 1 — Idle mic button -->
          <template v-if="recorder.isSupported.value && !recorder.isRecording.value && !recorder.recordedBlob.value">
            <div class="flex flex-col items-center">
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-md text-black/50 hover:bg-base-200 transition-colors"
                :class="{ 'text-error/70': recorder.permissionDenied.value }"
                aria-label="Voice input"
                @click="emit('voice'); recorder.start()"
              >
                <PhMicrophone :size="15" weight="regular" />
              </button>
              <span
                v-if="recorder.permissionDenied.value"
                class="mt-[2px] text-[10px] font-medium text-error leading-none"
              >
                Mic access denied
              </span>
            </div>
          </template>

          <!-- State 2 — Recording in progress -->
          <template v-else-if="recorder.isRecording.value">
            <div class="flex items-center gap-[6px]">
              <span class="h-2 w-2 animate-pulse rounded-full bg-error" aria-hidden="true" />
              <span class="text-[12px] font-medium tabular-nums text-error">
                {{ recorder.elapsedFormatted.value }}
              </span>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-md text-error hover:bg-error/10 transition-colors"
                aria-label="Stop recording"
                @click="recorder.stop()"
              >
                <PhStop :size="15" weight="fill" />
              </button>
            </div>
          </template>

          <!-- Send button -->
          <button
            class="btn btn-primary btn-sm aura-action-label h-[30px] min-h-[30px] gap-[6px] rounded-[5px] border-0 px-3 text-[13px] disabled:opacity-45"
            type="submit"
            :disabled="isSendDisabled"
          >
            <PhPaperPlaneRight :size="16" />
            Send
            <span class="inline-flex items-center gap-1.5 rounded-[2px] bg-base-100/20 px-[5px] py-[1px] text-[10px] leading-none">
              <span aria-hidden="true">{{ submitKey }}</span>
              <span>Enter</span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Recorder error display -->
    <p
      v-if="recorder.error.value"
      class="mt-[6px] px-[4px] text-[11px] font-medium text-error"
    >
      {{ recorder.error.value }}
    </p>
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import {
  PhFileText,
  PhMicrophone,
  PhPaperclip,
  PhPaperPlaneRight,
  PhPause,
  PhPlay,
  PhStop,
  PhTrash,
  PhWaveform,
  PhX,
} from '@phosphor-icons/vue'
import { useAudioRecorder } from '@/composables/useAudioRecorder'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
const submitKey = computed(() => isMac ? '⌘' : 'Ctrl')

const props = defineProps<{
  modelValue: string
  placeholder: string
  label: string
  attachments?: Array<{ name: string; type: 'file' | 'audio' }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
  attach: []
  voice: []
  'send-audio': [blob: Blob]
  'remove-attachment': [index: number]
}>()

const inputId = useId()
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isPlayingPreview = ref(false)
const previewAudio = ref<HTMLAudioElement | null>(null)

const recorder = useAudioRecorder()

const isSendDisabled = computed(() => {
  if (recorder.isRecording.value) return true
  if (recorder.recordedBlob.value) return false
  return !props.modelValue.trim()
})

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
  if (recorder.recordedBlob.value) {
    emit('send-audio', recorder.recordedBlob.value)
    stopPreviewPlayback()
    recorder.discard()
    return
  }
  if (!props.modelValue.trim()) return
  emit('submit')
}

function togglePreviewPlayback() {
  if (!recorder.previewUrl.value) return

  if (isPlayingPreview.value) {
    stopPreviewPlayback()
    return
  }

  const audio = new Audio(recorder.previewUrl.value)
  previewAudio.value = audio
  audio.onended = () => {
    isPlayingPreview.value = false
    previewAudio.value = null
  }
  audio.play().catch(() => {
    isPlayingPreview.value = false
    previewAudio.value = null
  })
  isPlayingPreview.value = true
}

function stopPreviewPlayback() {
  if (previewAudio.value) {
    previewAudio.value.pause()
    previewAudio.value.onended = null
    previewAudio.value = null
  }
  isPlayingPreview.value = false
}

function discardAudio() {
  stopPreviewPlayback()
  recorder.discard()
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    nextTick(() => {
      if (textareaRef.value) textareaRef.value.style.height = 'auto'
    })
  }
})
</script>
