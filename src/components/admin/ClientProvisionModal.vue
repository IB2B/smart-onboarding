<script setup lang="ts">
import { ref, watch } from 'vue'
import { PhX, PhCheckCircle, PhCopySimple, PhCheck, PhSpinner } from '@phosphor-icons/vue'

import { apiClient } from '@/services/api-client'

interface Props {
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

// Form fields
const companyName = ref('')
const contactName = ref('')
const contactEmail = ref('')

// UI state
const loading = ref(false)
const success = ref(false)
const errorMessage = ref('')
const portalUrl = ref('')
const copied = ref(false)

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ── Submission ────────────────────────────────────────────────────────────────

async function submit() {
  errorMessage.value = ''

  const email = contactEmail.value.trim()

  if (!companyName.value.trim() || !contactName.value.trim() || !email) {
    errorMessage.value = 'Please fill in all fields before submitting.'
    return
  }

  if (!isValidEmail(email)) {
    errorMessage.value = 'Please enter a valid email address.'
    return
  }

  loading.value = true
  try {
    const result = await apiClient.provisionClient({
      companyName: companyName.value.trim(),
      contactName: contactName.value.trim(),
      contactEmail: email,
    })
    portalUrl.value = result.portalUrl
    // Show success even when the email failed — admin still gets the portal URL
    // so they can share it manually or resend the invite later.
    if (result.emailError) {
      errorMessage.value = `Invite email failed: ${result.emailError}. Share the portal URL below manually.`
    }
    success.value = true
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Something went wrong.'
    errorMessage.value = msg === 'DUPLICATE_EMAIL'
      ? 'A client with this email already exists.'
      : 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}

// ── Copy URL ──────────────────────────────────────────────────────────────────

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(portalUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Clipboard permission denied or document not focused — silently ignore;
    // the URL is visible in the read-only input for manual copy
  }
}

// ── Reset on close ────────────────────────────────────────────────────────────

function reset() {
  companyName.value = ''
  contactName.value = ''
  contactEmail.value = ''
  loading.value = false
  success.value = false
  errorMessage.value = ''
  portalUrl.value = ''
  copied.value = false
}

watch(
  () => props.open,
  (val) => {
    if (!val) reset()
  },
)
</script>

<template>
  <div
    class="modal"
    :class="{ 'modal-open': props.open }"
    role="dialog"
    aria-modal="true"
    aria-labelledby="provision-modal-title"
    @keydown.esc="!loading && emit('close')"
  >
    <div class="modal-box max-w-md rounded-2xl border border-base-300/80 bg-base-100 p-0 shadow-xl">

      <!-- Header -->
      <header class="flex items-center justify-between border-b border-base-300/60 px-5 py-4">
        <h2 id="provision-modal-title" class="aura-heading text-base font-semibold">
          Invite New Client
        </h2>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
          aria-label="Close modal"
          :disabled="loading"
          @click="emit('close')"
        >
          <PhX :size="18" weight="bold" aria-hidden="true" />
        </button>
      </header>

      <!-- Form state -->
      <div v-if="!success" class="px-5 py-5">
        <form novalidate @submit.prevent="submit">
          <div class="space-y-4">

            <!-- Company Name -->
            <div class="form-control">
              <label class="label pb-1" for="provision-company-name">
                <span class="label-text text-sm font-medium">Company Name</span>
              </label>
              <input
                id="provision-company-name"
                v-model="companyName"
                type="text"
                name="organization"
                class="input input-bordered input-sm rounded-xl border-base-300/80 w-full"
                placeholder="Acme Corp"
                autocomplete="organization"
                :disabled="loading"
                required
              />
            </div>

            <!-- Contact Name -->
            <div class="form-control">
              <label class="label pb-1" for="provision-contact-name">
                <span class="label-text text-sm font-medium">Contact Name</span>
              </label>
              <input
                id="provision-contact-name"
                v-model="contactName"
                type="text"
                name="name"
                class="input input-bordered input-sm rounded-xl border-base-300/80 w-full"
                placeholder="Jane Smith"
                autocomplete="name"
                :disabled="loading"
                required
              />
            </div>

            <!-- Contact Email -->
            <div class="form-control">
              <label class="label pb-1" for="provision-contact-email">
                <span class="label-text text-sm font-medium">Contact Email</span>
              </label>
              <input
                id="provision-contact-email"
                v-model="contactEmail"
                type="email"
                name="email"
                class="input input-bordered input-sm rounded-xl border-base-300/80 w-full"
                placeholder="jane@acmecorp.com"
                autocomplete="email"
                spellcheck="false"
                autocorrect="off"
                autocapitalize="off"
                :disabled="loading"
                required
              />
            </div>

            <!-- Error alert -->
            <div
              v-if="errorMessage"
              role="alert"
              class="alert alert-error rounded-xl py-2.5 text-sm"
            >
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Submit -->
            <div class="pt-1">
              <button
                type="submit"
                class="btn btn-primary btn-sm w-full rounded-xl transition-[background-color,transform,box-shadow] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                :disabled="loading"
              >
                <PhSpinner
                  v-if="loading"
                  :size="16"
                  weight="bold"
                  aria-hidden="true"
                  class="animate-spin"
                />
                <span>{{ loading ? 'Sending Invite…' : 'Send Invite' }}</span>
              </button>
            </div>

          </div>
        </form>
      </div>

      <!-- Success state -->
      <div v-else class="px-5 py-6 flex flex-col items-center gap-4 text-center">
        <PhCheckCircle :size="52" weight="duotone" class="text-success" aria-hidden="true" />

        <div class="space-y-1">
          <p class="font-semibold text-base-content">Client created!</p>
          <p v-if="!errorMessage" class="text-sm text-base-content/65">
            A magic link has been sent to
            <span class="font-medium text-base-content/85">{{ contactEmail }}</span>.
          </p>
        </div>

        <!-- Email warning (shown when client was created but email delivery failed) -->
        <div
          v-if="errorMessage"
          role="alert"
          class="w-full rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-left text-sm text-warning-content"
        >
          {{ errorMessage }}
        </div>

        <!-- Copyable portal URL -->
        <div class="w-full">
          <p class="mb-1.5 text-left text-xs font-medium text-base-content/65">Portal URL</p>
          <div class="flex items-center gap-2">
            <input
              type="text"
              :value="portalUrl"
              readonly
              aria-label="Client portal URL"
              class="input input-bordered input-sm rounded-xl border-base-300/80 flex-1 bg-base-200/50 text-xs text-base-content/75 cursor-text select-all"
            />
            <button
              type="button"
              :aria-label="copied ? 'Copied!' : 'Copy portal URL'"
              class="btn btn-sm rounded-xl border border-base-300/80 bg-base-200/60 text-base-content
                     hover:bg-base-200/90 active:scale-[0.98] transition-[background-color,transform,box-shadow] focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-primary/40"
              @click="copyUrl"
            >
              <PhCheck v-if="copied" :size="15" weight="bold" class="text-success" aria-hidden="true" />
              <PhCopySimple v-else :size="15" aria-hidden="true" />
              <span class="ml-1 text-xs">{{ copied ? 'Copied!' : 'Copy' }}</span>
            </button>
          </div>
        </div>

        <!-- Done button -->
        <button
          type="button"
          class="btn btn-primary btn-sm w-full rounded-xl transition-[background-color,transform,box-shadow] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          @click="emit('close')"
        >
          Done
        </button>
      </div>

    </div>

    <!-- Backdrop close -->
    <div class="modal-backdrop bg-black/20 backdrop-blur-sm" @click="!loading && emit('close')" />
  </div>
</template>
