<template>
  <div
    data-theme="aura-frost"
    class="min-h-screen bg-base-200 flex items-center justify-center p-4"
  >
    <div class="w-full max-w-xs text-center">
      <!-- Logo -->
      <div class="flex justify-center mb-8">
        <AuraLogo brand-name="IntelligentB2B" />
      </div>

      <!-- Loading state -->
      <template v-if="!expired">
        <span
          class="loading loading-dots loading-md text-primary"
          role="status"
          aria-label="Signing you in"
        ></span>
        <p class="mt-4 text-sm text-base-content/60">Signing you in…</p>
      </template>

      <!-- Error / expired state -->
      <template v-else>
        <div class="flex flex-col items-center gap-3">
          <div class="rounded-full bg-error/10 p-3">
            <PhLinkBreak :size="24" weight="duotone" class="text-error" aria-hidden="true" />
          </div>
          <div>
            <h2 class="font-semibold text-base-content">Link expired or invalid</h2>
            <p class="mt-1 text-sm text-base-content/55">
              {{ errorDescription || 'This magic link is no longer valid. Please ask your admin to send a new invitation.' }}
            </p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PhLinkBreak } from '@phosphor-icons/vue'
import AuraLogo from '@/components/system/AuraLogo.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const expired = ref(false)
const errorDescription = ref('')

let timeout: ReturnType<typeof setTimeout> | null = null
let stopWatch: (() => void) | null = null

onMounted(async () => {
  // Supabase redirects auth errors into the URL hash immediately — detect and bail fast
  // e.g. #error=access_denied&error_code=otp_expired&error_description=...
  const hash = window.location.hash
  if (hash.includes('error=')) {
    const params = new URLSearchParams(hash.slice(1)) // strip leading #
    errorDescription.value =
      params.get('error_description')?.replaceAll('+', ' ') ??
      'This magic link is no longer valid.'
    expired.value = true
    return
  }

  // auth.init() calls getSession() which picks up the session Supabase established
  // from the access_token in the URL hash (detectSessionInUrl is on by default).
  await auth.init()

  // Session is ready — redirect immediately (covers both: magic link just processed
  // and the rare case where the user was already authenticated)
  if (auth.isAuthenticated) {
    await router.replace({ name: 'portal-chat' })
    return
  }

  // Not yet authenticated — start expiry countdown and watch for the SIGNED_IN event
  timeout = setTimeout(() => {
    stopWatch?.()
    stopWatch = null
    timeout = null
    errorDescription.value = 'The sign-in attempt timed out. Please request a new invitation.'
    expired.value = true
  }, 10_000)

  stopWatch = watch(
    () => auth.isAuthenticated,
    async (isAuth) => {
      if (isAuth) {
        stopWatch?.()
        stopWatch = null
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        await router.replace({ name: 'portal-chat' })
      }
    },
  )
})

onUnmounted(() => {
  stopWatch?.()
  stopWatch = null
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
})
</script>
