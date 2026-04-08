<script setup lang="ts">
import { ref, watch } from 'vue'
import { PhX, PhCheckCircle, PhCopySimple, PhCheck, PhSpinner } from '@phosphor-icons/vue'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

interface Props {
  open: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const auth = useAuthStore()

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
  const clientId = crypto.randomUUID()

  try {
    const { error: clientError } = await supabase.from('clients').insert({
      id: clientId,
      company_name: companyName.value.trim(),
      contact_name: contactName.value.trim(),
      contact_email: email,
    })

    if (clientError) {
      // 23505 = unique_violation (duplicate email)
      errorMessage.value = clientError.code === '23505'
        ? 'A client with this email already exists.'
        : 'Something went wrong. Please try again.'
      return
    }

    const { error: stateError } = await supabase.from('onboarding_states').insert({
      client_id: clientId,
      phase: 'welcome',
      status: 'active',
      milestones: {},
      collected_data: {},
    })

    if (stateError) {
      // Compensate: delete the client row so there are no orphaned records
      await supabase.from('clients').delete().eq('id', clientId)
      errorMessage.value = 'Something went wrong. Please try again.'
      return
    }

    const redirectTo = `${window.location.origin}/portal/auth/callback`
    try {
      await auth.sendMagicLink(email, redirectTo)
    } catch (err) {
      // Both DB rows are committed. Show the actual reason so admin can act on it
      // (e.g. rate limit = wait and resend, invalid email = fix the address)
      const reason = err instanceof Error ? err.message : 'Unknown error'
      errorMessage.value = `Client created, but invite email failed: ${reason}`
      return
    }

    // The portal URL does not contain the client ID — identity is resolved via Supabase auth
    // after the client clicks the magic link (see getPortalSession in supabase-adapter.ts)
    portalUrl.value = `${window.location.origin}/portal/chat`
    success.value = true
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
                class="input input-bordered input-sm rounded-xl border-base-300/80 w-full"
                placeholder="jane@acmecorp.com"
                autocomplete="email"
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
                class="btn btn-primary btn-sm w-full rounded-xl transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
          <p class="font-semibold text-base-content">Client invited successfully!</p>
          <p class="text-sm text-base-content/65">
            A magic link has been sent to
            <span class="font-medium text-base-content/85">{{ contactEmail }}</span>.
          </p>
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
                     hover:bg-base-200/90 active:scale-[0.98] transition-all focus-visible:outline-none
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
          class="btn btn-primary btn-sm w-full rounded-xl transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
