<template>
  <div data-theme="aura-frost" class="auth-screen flex items-center justify-center p-4">
    <div class="auth-shell">
      <!-- Logo centered above card -->
      <div class="auth-logo-wrap">
        <AuraLogo />
      </div>

      <!-- ── Login form ───────────────────────────────────────────────── -->
      <div v-if="mode === 'login'" class="auth-card">
        <div class="card-body gap-5 p-6 md:p-7">
          <div>
            <span class="auth-eyebrow">Admin Portal</span>
            <h1 class="mt-4 text-2xl font-semibold tracking-[-0.03em] text-base-content">Operate the onboarding desk</h1>
            <p class="auth-subtle mt-2 text-sm leading-6">Sign in to manage invites, watch onboarding health, and keep client handoffs moving.</p>
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
                placeholder="admin@example.com"
                :disabled="loading"
                class="input input-bordered input-sm w-full bg-base-100/80"
              />
            </label>

            <!-- Password field -->
            <label class="form-control">
              <div class="label pb-1">
                <span class="label-text text-xs font-medium">Password</span>
              </div>
              <input
                v-model="password"
                type="password"
                name="password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
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
              :disabled="loading || !email || !password"
              class="btn btn-primary btn-sm w-full"
            >
              <span
                v-if="loading"
                class="loading loading-spinner loading-xs"
                aria-hidden="true"
              ></span>
              {{ loading ? 'Signing in…' : 'Sign In' }}
            </button>
          </form>

          <div class="auth-panel p-4">
            <div class="auth-tip-list">
              <div class="auth-tip-row">
                <span class="auth-tip-icon"><PhLockKey :size="14" weight="fill" /></span>
                <span>Use your admin credentials to access alerts, client monitoring, and onboarding actions.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Set new password form ────────────────────────────────────── -->
      <div v-else class="auth-card">
        <div class="card-body gap-5 p-6 md:p-7">
          <div class="flex items-center gap-2">
            <PhLockKey :size="20" class="text-primary shrink-0" aria-hidden="true" />
            <div>
              <h1 class="text-lg font-semibold text-base-content">Set New Password</h1>
              <p class="text-sm text-base-content/55 mt-0.5">Choose a strong password for your account</p>
            </div>
          </div>

          <form @submit.prevent="handleSetPassword" class="flex flex-col gap-4">
            <!-- New password field -->
            <label class="form-control">
              <div class="label pb-1">
                <span class="label-text text-xs font-medium">New Password</span>
              </div>
              <input
                v-model="newPassword"
                type="password"
                required
                minlength="8"
                autocomplete="new-password"
                placeholder="Min. 8 characters"
                :disabled="resetLoading"
                class="input input-bordered input-sm w-full bg-base-100/80"
              />
            </label>

            <!-- Confirm password field -->
            <label class="form-control">
              <div class="label pb-1">
                <span class="label-text text-xs font-medium">Confirm Password</span>
              </div>
              <input
                v-model="confirmPassword"
                type="password"
                required
                minlength="8"
                autocomplete="new-password"
                placeholder="Re-enter your new password"
                :disabled="resetLoading"
                class="input input-bordered input-sm w-full bg-base-100/80"
              />
            </label>

            <!-- Error alert -->
            <div v-if="resetError" role="alert" class="alert alert-error py-2 text-sm">
              <PhWarning :size="16" aria-hidden="true" />
              <span>{{ resetError }}</span>
            </div>

            <!-- Success alert -->
            <div v-if="resetSuccess" role="alert" class="alert alert-success py-2 text-sm">
              <span>Password updated. Redirecting…</span>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="resetLoading || !newPassword || !confirmPassword"
              class="btn btn-primary btn-sm w-full"
            >
              <span
                v-if="resetLoading"
                class="loading loading-spinner loading-xs"
                aria-hidden="true"
              ></span>
              {{ resetLoading ? 'Saving…' : 'Set Password' }}
            </button>
          </form>

          <button
            type="button"
            class="text-left text-sm text-base-content/60 transition-colors hover:text-base-content"
            @click="mode = 'login'"
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PhWarning, PhLockKey } from '@phosphor-icons/vue'
import AuraLogo from '@/components/system/AuraLogo.vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const auth = useAuthStore()

// ── Login form state ──────────────────────────────────────────────────────────
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

// ── Mode ──────────────────────────────────────────────────────────────────────
const mode = ref<'login' | 'set-password'>('login')

// ── Set-password form state ───────────────────────────────────────────────────
const newPassword = ref('')
const confirmPassword = ref('')
const resetLoading = ref(false)
const resetError = ref('')
const resetSuccess = ref(false)

// ── onMounted ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  const hash = window.location.hash
  if (hash.includes('type=recovery')) {
    // Supabase has already exchanged the hash for a session via detectSessionInUrl
    await auth.init()
    mode.value = 'set-password'
    return
  }

  // Normal login page — redirect if already authenticated admin
  await auth.init()
  if (auth.isAuthenticated && auth.isAdmin) {
    await router.replace({ name: 'admin-monitor' })
  }
})

// ── Handlers ──────────────────────────────────────────────────────────────────
async function handleSubmit(): Promise<void> {
  errorMessage.value = ''
  loading.value = true
  try {
    await auth.signInAdmin(email.value, password.value)
    await router.push({ name: 'admin-monitor' })
  } catch {
    // Use a generic message to avoid leaking whether the email exists (user enumeration)
    errorMessage.value = 'Sign in failed. Please check your credentials and try again.'
  } finally {
    loading.value = false
  }
}

async function handleSetPassword(): Promise<void> {
  resetError.value = ''

  if (newPassword.value !== confirmPassword.value) {
    resetError.value = 'Passwords do not match. Please try again.'
    return
  }

  if (newPassword.value.length < 8) {
    resetError.value = 'Password must be at least 8 characters.'
    return
  }

  resetLoading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value })
    if (error) throw error
    resetSuccess.value = true
    await router.replace({ name: 'admin-monitor' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update password. Please try again.'
    resetError.value = message
  } finally {
    resetLoading.value = false
  }
}
</script>
