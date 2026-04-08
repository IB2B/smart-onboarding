import { ref, computed, onUnmounted, readonly } from 'vue'
import type { Ref, ComputedRef } from 'vue'

export interface UseAudioRecorder {
  isSupported: Readonly<Ref<boolean>>
  isRecording: Readonly<Ref<boolean>>
  permissionDenied: Readonly<Ref<boolean>>
  elapsedSeconds: Readonly<Ref<number>>
  elapsedFormatted: ComputedRef<string>
  recordedBlob: Readonly<Ref<Blob | null>>
  previewUrl: Readonly<Ref<string | null>>
  error: Readonly<Ref<string | null>>
  start: () => Promise<void>
  stop: () => void
  discard: () => void
}

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg',
  '',
] as const

function negotiateMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  for (const mime of MIME_CANDIDATES) {
    if (mime === '' || MediaRecorder.isTypeSupported(mime)) return mime
  }
  return ''
}

export function useAudioRecorder(options?: { maxDurationSeconds?: number }): UseAudioRecorder {
  const maxDuration = options?.maxDurationSeconds ?? 300

  const isSupported = ref(typeof MediaRecorder !== 'undefined')
  const isRecording = ref(false)
  const permissionDenied = ref(false)
  const elapsedSeconds = ref(0)
  const recordedBlob = ref<Blob | null>(null)
  const previewUrl = ref<string | null>(null)
  const error = ref<string | null>(null)

  let mediaRecorder: MediaRecorder | null = null
  let stream: MediaStream | null = null
  let intervalId: ReturnType<typeof setInterval> | null = null
  let chunks: BlobPart[] = []
  let isMounted = true

  const elapsedFormatted: ComputedRef<string> = computed(() => {
    const m = Math.floor(elapsedSeconds.value / 60)
    const s = elapsedSeconds.value % 60
    return `${m}:${String(s).padStart(2, '0')}`
  })

  function clearInterval_(): void {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function releaseStream(): void {
    if (stream !== null) {
      stream.getTracks().forEach((track) => track.stop())
      stream = null
    }
  }

  function revokePreviewUrl(): void {
    if (previewUrl.value !== null) {
      URL.revokeObjectURL(previewUrl.value)
    }
  }

  function discard(): void {
    revokePreviewUrl()
    previewUrl.value = null
    recordedBlob.value = null
    elapsedSeconds.value = 0
  }

  function stop(): void {
    if (isRecording.value && mediaRecorder !== null) {
      mediaRecorder.stop()
    }
  }

  async function start(): Promise<void> {
    if (isRecording.value) return

    error.value = null
    permissionDenied.value = false

    discard()

    let acquiredStream: MediaStream
    try {
      acquiredStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        permissionDenied.value = true
        error.value = 'Microphone access was denied. Please allow mic access in your browser settings.'
      } else {
        error.value = 'Could not start recording. Please try again.'
      }
      return
    }

    stream = acquiredStream
    chunks = []

    const mimeType = negotiateMimeType()
    const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {}
    mediaRecorder = new MediaRecorder(stream, recorderOptions)

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      releaseStream()
      clearInterval_()
      isRecording.value = false

      // Only create object URL if component is still mounted — prevents leak on unmount-stop
      if (isMounted) {
        const blobOptions = mimeType ? { type: mimeType } : {}
        const blob = new Blob(chunks, blobOptions)
        recordedBlob.value = blob
        previewUrl.value = URL.createObjectURL(blob)
      }

      chunks = []
    }

    isRecording.value = true
    mediaRecorder.start()

    intervalId = setInterval(() => {
      elapsedSeconds.value += 1
      if (elapsedSeconds.value >= maxDuration) {
        error.value = 'Recording stopped: maximum duration reached.'
        stop()
      }
    }, 1000)
  }

  onUnmounted(() => {
    isMounted = false
    if (isRecording.value && mediaRecorder !== null) {
      mediaRecorder.stop()
    }
    releaseStream()
    clearInterval_()
    revokePreviewUrl()
  })

  return {
    isSupported: readonly(isSupported),
    isRecording: readonly(isRecording),
    permissionDenied: readonly(permissionDenied),
    elapsedSeconds: readonly(elapsedSeconds),
    elapsedFormatted,
    recordedBlob: readonly(recordedBlob),
    previewUrl: readonly(previewUrl),
    error: readonly(error),
    start,
    stop,
    discard,
  }
}
