<template>
  <div data-theme="aura-frost" class="min-h-screen bg-base-200 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- Logo centered above card -->
      <div class="flex justify-center mb-6">
        <AuraLogo />
      </div>

      <div class="card bg-base-100 shadow-sm border border-base-300/60">
        <div class="card-body gap-5">
          <div>
            <h1 class="text-lg font-semibold text-base-content">Admin Portal</h1>
            <p class="text-sm text-base-content/55 mt-0.5">Sign in to continue</p>
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
                required
                autocomplete="email"
                placeholder="admin@example.com"
                :disabled="loading"
                class="input input-bordered input-sm w-full"
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
                required
                autocomplete="current-password"
                placeholder="••••••••"
                :disabled="loading"
                class="input input-bordered input-sm w-full"
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PhWarning } from '@phosphor-icons/vue'
import AuraLogo from '@/components/system/AuraLogo.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

// If already authenticated as admin, redirect immediately
onMounted(async () => {
  await auth.init()
  if (auth.isAuthenticated && auth.isAdmin) {
    await router.replace({ name: 'admin-monitor' })
  }
})

async function handleSubmit() {
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
</script>
