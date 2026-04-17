<template>
  <form
    class="rounded-[14px] border border-base-300/80 bg-base-200/75 p-[6px]"
    @submit.prevent="handleSubmit"
  >
    <!-- Attachment chips — only rendered when attachments exist -->
    <div v-if="attachments && attachments.length > 0" class="mb-[5px] flex flex-wrap items-center gap-[5px]">
      <span
        v-for="(attachment, index) in attachments"
        :key="index"
        class="inline-flex h-[30px] items-center gap-[6px] rounded-[8px] border border-base-300/80 bg-base-100 px-[10px] text-[13px] font-medium tracking-[-0.04em] text-base-content/75"
      >
        <PhFileText v-if="attachment.type === 'file'" :size="16" />
        <PhWaveform v-else-if="attachment.type === 'audio'" :size="16" />
        {{ attachment.name }}
        <button
          type="button"
          class="text-base-content/55 transition-colors hover:text-base-content"
          :aria-label="`Remove ${attachment.name}`"
          @click="emit('remove-attachment', index)"
        >
          <PhX :size="14" />
        </button>
      </span>
    </div>

    <div class="rounded-[12px] bg-base-100 px-[14px] py-[10px]">
      <label class="sr-only" :for="inputId">{{ label }}</label>
      <textarea
        :id="inputId"
        ref="textareaRef"
        rows="1"
        :value="modelValue"
        class="min-h-[22px] w-full resize-none bg-transparent text-[14px] font-medium leading-[1.21] tracking-[-0.04em] text-base-content/85 placeholder:text-base-content/50 focus:outline-none"
        :placeholder="placeholder"
        style="max-height: 7.5rem; overflow-y: auto;"
        @input="onInput"
        @keydown="onKeydown"
      />

      <!-- Audio preview row — State 3: recorded blob ready -->
      <div
        v-if="!recorder.isRecording.value && recorder.recordedBlob.value"
        class="mt-[10px] flex items-center gap-[8px] rounded-[10px] border border-base-300/70 bg-base-200/80 px-[10px] py-[8px]"
      >
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-md text-base-content/70 transition-colors hover:bg-base-300/70 hover:text-base-content"
          :aria-label="isPlayingPreview ? 'Pause preview' : 'Play preview'"
          @click="togglePreviewPlayback"
        >
          <PhPlay v-if="!isPlayingPreview" :size="14" weight="fill" />
          <PhPause v-else :size="14" weight="fill" />
        </button>
        <span class="flex-1 text-[12px] font-medium tracking-[-0.04em] text-base-content/75">Voice message ready to send</span>
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-md text-error-content/80 transition-colors hover:bg-error/15 hover:text-error-content"
          aria-label="Discard voice message"
          @click="discardAudio"
        >
          <PhTrash :size="14" />
        </button>
      </div>

      <div class="mt-[14px] flex items-center justify-between gap-3">
        <button
          type="button"
          class="inline-flex h-[30px] items-center gap-[5px] rounded-[8px] border border-base-300/80 bg-base-200/85 px-3 text-[12px] font-medium tracking-[-0.04em] text-base-content/75 transition-colors hover:bg-base-300/75 hover:text-base-content disabled:cursor-not-allowed disabled:bg-base-200/60 disabled:text-base-content/40"
          aria-label="Attach"
          :disabled="recorder.isRecording.value"
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
                class="flex h-8 w-8 items-center justify-center rounded-md text-base-content/65 transition-colors hover:bg-base-200 hover:text-base-content"
                :class="{ 'text-error-content': recorder.permissionDenied.value }"
                aria-label="Voice input"
                @click="recorder.start()"
              >
                <PhMicrophone :size="15" weight="regular" />
              </button>
              <span
                v-if="recorder.permissionDenied.value"
                class="mt-[2px] text-[10px] font-medium leading-none text-error-content"
              >
                Mic access denied
              </span>
            </div>
          </template>

          <!-- State 2 — Recording in progress -->
          <template v-else-if="recorder.isRecording.value">
            <div class="flex items-center gap-[8px] rounded-full border border-error/35 bg-error/14 px-3 py-1.5">
              <span class="h-2 w-2 animate-pulse rounded-full bg-error-content" aria-hidden="true" />
              <span class="text-[12px] font-semibold tabular-nums text-error-content">
                {{ recorder.elapsedFormatted.value }}
              </span>
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-md text-error-content transition-colors hover:bg-error/20"
                aria-label="Stop recording"
                @click="recorder.stop()"
              >
                <PhStop :size="15" weight="fill" />
              </button>
            </div>
          </template>

          <!-- Send button -->
          <button
            class="btn btn-primary btn-sm aura-action-label aura-send-button h-[32px] min-h-[32px] gap-[6px] rounded-[8px] border-0 px-3 text-[13px]"
            type="submit"
            :disabled="isSendDisabled"
          >
            <PhPaperPlaneRight :size="16" />
            {{ sendButtonLabel }}
            <span
              class="inline-flex items-center gap-1.5 rounded-[4px] px-[5px] py-[1px] text-[10px] leading-none"
              :class="
                isSendDisabled
                  ? 'bg-base-content/10 text-base-content/65'
                  : 'bg-primary-content/18 text-primary-content/90'
              "
            >
              <span aria-hidden="true">{{ submitKey }}</span>
              <span>Enter</span>
            </span>
          </button>
        </div>
      </div>

      <p class="mt-3 text-[11px] font-medium tracking-[-0.02em] text-base-content/60">
        {{ actionHint }}
      </p>
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
  'send-audio': [blob: Blob, durationSec: number]
  'remove-attachment': [index: number]
}>()

const inputId = useId()
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isPlayingPreview = ref(false)
const previewAudio = ref<HTMLAudioElement | null>(null)

const recorder = useAudioRecorder()
const hasRecordedAudio = computed(() => recorder.recordedBlob.value !== null)

const isSendDisabled = computed(() => {
  if (recorder.isRecording.value) return true
  if (hasRecordedAudio.value) return false
  if ((props.attachments?.length ?? 0) > 0) return false
  return !props.modelValue.trim()
})

const sendButtonLabel = computed(() => (hasRecordedAudio.value ? 'Send voice' : 'Send'))

const actionHint = computed(() => {
  if (recorder.isRecording.value) {
    return 'Recording in progress. Tap stop when you are ready to review the clip.'
  }
  if (hasRecordedAudio.value) {
    return 'Preview your clip, then send it as a voice message or discard it to re-record.'
  }
  if ((props.attachments?.length ?? 0) > 0) {
    return 'Your attachment is ready. Send it with or without a typed message.'
  }
  if (props.modelValue.trim()) {
    return 'Press Enter to send, or Shift + Enter for a new line.'
  }
  return 'Type a message, attach a file, or record a voice note.'
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
    emit('send-audio', recorder.recordedBlob.value, recorder.elapsedSeconds.value)
    stopPreviewPlayback()
    recorder.discard()
    return
  }
  if (!props.modelValue.trim() && (props.attachments?.length ?? 0) === 0) return
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
