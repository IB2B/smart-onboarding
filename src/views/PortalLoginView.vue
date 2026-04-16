<template>
  <div data-theme="aura-frost" class="auth-screen flex items-center justify-center p-4">
    <div class="auth-shell">
      <!-- Logo centered above card -->
      <div class="auth-logo-wrap">
        <AuraLogo />
      </div>

      <div class="auth-card">
        <div class="card-body gap-5 p-6 md:p-7">
          <!-- Success state -->
          <template v-if="sent">
            <div class="flex flex-col items-center gap-3 py-2 text-center">
              <PhEnvelopeSimple :size="40" weight="duotone" class="text-primary" aria-hidden="true" />
              <div>
                <h1 class="text-lg font-semibold text-base-content">Check your inbox</h1>
                <p class="text-sm text-base-content/55 mt-1">
                  We sent a sign-in link to
                  <strong class="text-base-content font-medium">{{ email }}</strong>.
                  Click the link to access your portal.
                </p>
              </div>
            </div>
            <div class="auth-panel p-4 text-center">
              <p class="text-xs text-base-content/60">
                Didn't receive it? Check your spam folder or
                <button
                  type="button"
                  class="link link-primary font-medium"
                  @click="tryAgain"
                >
                  send again
                </button>
              </p>
            </div>
          </template>

          <!-- Form state -->
          <template v-else>
            <div>
              <span class="auth-eyebrow">Client Portal</span>
              <h1 class="mt-4 text-2xl font-semibold tracking-[-0.03em] text-base-content">Continue your onboarding</h1>
              <p class="auth-subtle mt-2 text-sm leading-6">
                Enter your email and we'll send you a sign-in link
              </p>
            </div>

            <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
              <!-- Email field -->
              <label class="form-control">
                <div class="label pb-1">
                  <span class="label-text text-xs font-medium">Email</span>
                </div>
                <input
                  v-model="email"
                  type="email"
                  name="email"
                  required
                  autocomplete="email"
                  spellcheck="false"
                  autocorrect="off"
                  autocapitalize="off"
                  placeholder="you@example.com"
                  :disabled="loading"
                  class="input input-bordered input-sm w-full bg-base-100/80"
                />
              </label>

              <!-- Error alert -->
              <div v-if="errorMessage" role="alert" class="alert alert-error py-2 text-sm">
                <PhWarning :size="16" aria-hidden="true" />
                <span>{{ errorMessage }}</span>
              </div>

              <!-- Submit -->
              <button
                type="submit"
                :disabled="loading || !email"
                class="btn btn-primary btn-sm w-full"
              >
                <span
                  v-if="loading"
                  class="loading loading-spinner loading-xs"
                  aria-hidden="true"
                ></span>
                {{ loading ? 'Sending…' : 'Send sign-in link' }}
              </button>
            </form>

            <div class="auth-panel p-4">
              <div class="auth-tip-list">
                <div class="auth-tip-row">
                  <span class="auth-tip-icon"><PhEnvelopeSimple :size="14" weight="fill" /></span>
                  <span>We’ll email a secure link to the address your administrator invited.</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PhEnvelopeSimple, PhWarning } from '@phosphor-icons/vue'
import AuraLogo from '@/components/system/AuraLogo.vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const auth = useAuthStore()
const router = useRouter()

// Redirect to portal if auth state becomes active in another tab (magic link clicked elsewhere)
watch(() => auth.isAuthenticated, (authenticated) => {
  if (authenticated && !auth.isAdmin) {
    router.replace({ name: 'portal-chat' })
  }
})

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  loading.value = true
  try {
    const trimmedEmail = email.value.trim()

    // Verify this email belongs to an invited client before sending
    // Uses a SECURITY DEFINER RPC so anon users can check without RLS access to clients table
    const { data: clientExists, error: lookupError } = await supabase
      .rpc('check_client_email', { lookup_email: trimmedEmail })

    if (lookupError) {
      errorMessage.value = 'Something went wrong. Please try again.'
      return
    }

    if (!clientExists) {
      errorMessage.value = 'No account found for this email. Please contact your administrator.'
      return
    }

    const redirectTo = `${window.location.origin}/portal/auth/callback`
    await auth.sendMagicLink(trimmedEmail, redirectTo)
    sent.value = true
  } catch (err) {
    errorMessage.value =
      err instanceof Error ? err.message : 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}

function tryAgain() {
  sent.value = false
  errorMessage.value = ''
}
</script>
