<template>
  <div :data-theme="store.decision.themeId" class="contents">
    <AdminShellFrame
      :theme="store.decision.themeId"
      :font-pair-id="store.decision.fontPairId"
      :icon-pack-id="store.decision.iconPackId"
      :density="store.decision.density"
      title="Account"
      brand-name="IntelligentB2B"
      search-label="Search"
      command-symbol="Ctrl"
      command-key="K"
      :sections="sidebarSections"
    >
      <template #sidebarFooter>
        <ProfileDock
          detail="Monitoring Portal"
          :name="auth.userEmail ?? 'Admin'"
          @sign-out="handleSignOut"
        />
      </template>

      <template #topbarActions>
        <button
          type="button"
          class="btn btn-sm gap-1.5 rounded-lg border border-base-300/80 bg-base-100 text-base-content/60
                 hover:bg-base-200 hover:text-base-content transition-colors cursor-pointer"
          @click="router.push({ name: 'admin-monitor' })"
        >
          <PhArrowLeft :size="14" />
          <span class="hidden sm:inline text-xs font-medium">Monitor</span>
        </button>
      </template>

      <template #default>
        <div class="mx-auto flex w-full max-w-[680px] flex-col gap-4 p-3 md:p-6">

          <!-- ── Identity card ─────────────────────────────────────────── -->
          <div class="rounded-xl border border-base-300/80 bg-base-100 px-6 py-5">
            <div class="flex items-center gap-4">
              <!-- Avatar -->
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                :style="{ background: avatarGradient(auth.userEmail ?? 'A') }"
                aria-hidden="true"
              >
                {{ (auth.userEmail ?? 'A').slice(0, 2).toUpperCase() }}
              </div>
              <!-- Info -->
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-base-content">
                  {{ displayName || auth.userEmail }}
                </p>
                <p class="mt-0.5 truncate text-xs text-base-content/50">{{ auth.userEmail }}</p>
              </div>
              <!-- Role badge -->
              <span class="shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                admin
              </span>
            </div>
          </div>

          <!-- ── Profile ──────────────────────────────────────────────── -->
          <section class="rounded-xl border border-base-300/80 bg-base-100">
            <!-- Section header -->
            <div class="border-b border-base-300/60 px-6 py-4">
              <h2 class="text-sm font-semibold text-base-content">Profile</h2>
              <p class="mt-0.5 text-xs text-base-content/50">Update your display name</p>
            </div>

            <form class="px-6 py-5" @submit.prevent="handleSaveProfile">
              <div class="flex flex-col gap-1.5">
                <label for="display-name" class="text-xs font-medium text-base-content/65">
                  Display Name
                </label>
                <input
                  id="display-name"
                  v-model="displayName"
                  type="text"
                  placeholder="Your name"
                  :disabled="profileLoading"
                  class="input input-bordered input-sm w-full rounded-lg border-base-300/80 bg-base-200/40
                         text-sm placeholder:text-base-content/30 focus:outline-none focus:ring-2
                         focus:ring-primary/30 focus:border-primary/50 disabled:cursor-not-allowed
                         disabled:opacity-60 transition-colors"
                />
              </div>

              <!-- Feedback -->
              <div v-if="profileError" class="mt-3 flex items-center gap-2 text-xs text-red-600">
                <PhWarningCircle :size="13" aria-hidden="true" />
                <span>{{ profileError }}</span>
              </div>
              <div v-if="profileSuccess" class="mt-3 flex items-center gap-2 text-xs text-emerald-600">
                <PhCheckCircle :size="13" aria-hidden="true" />
                <span>Display name saved.</span>
              </div>

              <div class="mt-5 flex items-center gap-3">
                <button
                  type="submit"
                  :disabled="profileLoading"
                  class="btn btn-primary btn-sm rounded-lg px-4 text-xs font-medium
                         cursor-pointer hover:brightness-105 active:scale-[0.97]
                         transition-all disabled:cursor-not-allowed"
                >
                  <span v-if="profileLoading" class="loading loading-spinner loading-xs" aria-hidden="true" />
                  {{ profileLoading ? 'Saving…' : 'Save changes' }}
                </button>
              </div>
            </form>
          </section>

          <!-- ── Change Password ───────────────────────────────────────── -->
          <section class="rounded-xl border border-base-300/80 bg-base-100">
            <div class="border-b border-base-300/60 px-6 py-4">
              <h2 class="text-sm font-semibold text-base-content">Password</h2>
              <p class="mt-0.5 text-xs text-base-content/50">Set a new password for your admin account</p>
            </div>

            <form class="px-6 py-5" @submit.prevent="handleChangePassword">
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="flex flex-col gap-1.5">
                  <label for="new-password" class="text-xs font-medium text-base-content/65">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    v-model="newPassword"
                    type="password"
                    required
                    minlength="8"
                    autocomplete="new-password"
                    placeholder="Min. 8 characters"
                    :disabled="passwordLoading"
                    class="input input-bordered input-sm w-full rounded-lg border-base-300/80 bg-base-200/40
                           text-sm placeholder:text-base-content/30 focus:outline-none focus:ring-2
                           focus:ring-primary/30 focus:border-primary/50 disabled:cursor-not-allowed
                           disabled:opacity-60 transition-colors"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label for="confirm-password" class="text-xs font-medium text-base-content/65">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    v-model="confirmPassword"
                    type="password"
                    required
                    minlength="8"
                    autocomplete="new-password"
                    placeholder="Re-enter password"
                    :disabled="passwordLoading"
                    class="input input-bordered input-sm w-full rounded-lg border-base-300/80 bg-base-200/40
                           text-sm placeholder:text-base-content/30 focus:outline-none focus:ring-2
                           focus:ring-primary/30 focus:border-primary/50 disabled:cursor-not-allowed
                           disabled:opacity-60 transition-colors"
                  />
                </div>
              </div>

              <!-- Password match indicator -->
              <div
                v-if="newPassword && confirmPassword"
                class="mt-2.5 flex items-center gap-1.5 text-xs"
                :class="newPassword === confirmPassword ? 'text-emerald-600' : 'text-red-500'"
              >
                <component
                  :is="newPassword === confirmPassword ? PhCheckCircle : PhXCircle"
                  :size="12"
                  aria-hidden="true"
                />
                {{ newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match' }}
              </div>

              <!-- Feedback -->
              <div v-if="passwordError" class="mt-3 flex items-center gap-2 text-xs text-red-600">
                <PhWarningCircle :size="13" aria-hidden="true" />
                <span>{{ passwordError }}</span>
              </div>
              <div v-if="passwordSuccess" class="mt-3 flex items-center gap-2 text-xs text-emerald-600">
                <PhCheckCircle :size="13" aria-hidden="true" />
                <span>Password updated successfully.</span>
              </div>

              <div class="mt-5">
                <button
                  type="submit"
                  :disabled="passwordLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword"
                  class="btn btn-primary btn-sm rounded-lg px-4 text-xs font-medium
                         cursor-pointer hover:brightness-105 active:scale-[0.97]
                         transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span v-if="passwordLoading" class="loading loading-spinner loading-xs" aria-hidden="true" />
                  {{ passwordLoading ? 'Updating…' : 'Update Password' }}
                </button>
              </div>
            </form>
          </section>

          <!-- ── Account (read-only) ──────────────────────────────────── -->
          <section class="rounded-xl border border-base-300/80 bg-base-100">
            <div class="border-b border-base-300/60 px-6 py-4">
              <h2 class="text-sm font-semibold text-base-content">Account Details</h2>
            </div>

            <div class="px-6 py-5 flex flex-col gap-4">
              <div class="flex flex-col gap-1.5">
                <span class="text-xs font-medium text-base-content/65">Email address</span>
                <input
                  :value="auth.userEmail ?? ''"
                  type="email"
                  readonly
                  disabled
                  class="input input-bordered input-sm w-full rounded-lg border-base-300/60 bg-base-200/30
                         text-sm text-base-content/50 cursor-not-allowed select-text"
                />
                <p class="text-[11px] text-base-content/40">
                  Email changes require re-verification via the Supabase dashboard.
                </p>
              </div>
            </div>
          </section>

          <!-- ── Client Auth info ─────────────────────────────────────── -->
          <section class="rounded-xl border border-base-300/60 bg-base-100">
            <div class="flex items-start gap-3.5 px-6 py-5">
              <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <PhEnvelopeSimple :size="14" class="text-blue-600" aria-hidden="true" />
              </div>
              <div>
                <p class="text-xs font-semibold text-base-content/80">Client Authentication</p>
                <p class="mt-1 text-xs leading-relaxed text-base-content/55">
                  Clients sign in via <strong class="font-medium text-base-content/75">magic link</strong> — no passwords.
                  To give a client access, resend their invite from the
                  <button
                    type="button"
                    class="font-medium text-primary underline underline-offset-2 hover:text-primary/75
                           transition-colors cursor-pointer"
                    @click="router.push({ name: 'admin-clients' })"
                  >Clients</button> page.
                </p>
              </div>
            </div>
          </section>

        </div>
      </template>
    </AdminShellFrame>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  PhArrowLeft,
  PhBell,
  PhChartLineUp,
  PhCheckCircle,
  PhEnvelopeSimple,
  PhUserCircle,
  PhUsersThree,
  PhWarningCircle,
  PhXCircle,
} from '@phosphor-icons/vue'

import AdminShellFrame from '@/components/admin/AdminShellFrame.vue'
import ProfileDock from '@/components/system/ProfileDock.vue'
import { supabase } from '@/lib/supabase'
import { useSpecLabStore } from '@/stores/spec-lab'
import { useAuthStore } from '@/stores/auth'

const store = useSpecLabStore()
const auth = useAuthStore()
const router = useRouter()

// ── Sidebar ───────────────────────────────────────────────────────────────────
const sidebarSections = [
  {
    title: 'Monitor',
    items: [
      { label: 'Overview', to: '/admin/monitor', icon: PhChartLineUp },
      { label: 'Clients', to: '/admin/clients', icon: PhUsersThree },
      { label: 'Alerts', to: '/admin/alerts', icon: PhBell },
    ],
  },
  {
    title: 'Account',
    items: [{ label: 'Account', to: '/admin/account', active: true, icon: PhUserCircle }],
  },
]

// ── Profile form ──────────────────────────────────────────────────────────────
const displayName = ref('')
const profileLoading = ref(false)
const profileError = ref('')
const profileSuccess = ref(false)

// ── Password form ─────────────────────────────────────────────────────────────
const newPassword = ref('')
const confirmPassword = ref('')
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref(false)

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await auth.init()
  const { data } = await supabase.auth.getUser()
  displayName.value = (data.user?.user_metadata?.['display_name'] as string | undefined) ?? ''
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function avatarGradient(email: string): string {
  const hue = (email.charCodeAt(0) * 47) % 360
  return `linear-gradient(135deg, hsl(${hue}, 65%, 52%), hsl(${(hue + 40) % 360}, 65%, 45%))`
}

// ── Handlers ──────────────────────────────────────────────────────────────────
async function handleSaveProfile(): Promise<void> {
  profileError.value = ''
  profileSuccess.value = false
  profileLoading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ data: { display_name: displayName.value } })
    if (error) throw error
    profileSuccess.value = true
    setTimeout(() => { profileSuccess.value = false }, 3000)
  } catch (err: unknown) {
    profileError.value = err instanceof Error ? err.message : 'Failed to save profile.'
  } finally {
    profileLoading.value = false
  }
}

async function handleChangePassword(): Promise<void> {
  passwordError.value = ''
  passwordSuccess.value = false

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match.'
    return
  }
  if (newPassword.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters.'
    return
  }

  passwordLoading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value })
    if (error) throw error
    passwordSuccess.value = true
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => { passwordSuccess.value = false }, 3000)
  } catch (err: unknown) {
    passwordError.value = err instanceof Error ? err.message : 'Failed to update password.'
  } finally {
    passwordLoading.value = false
  }
}

async function handleSignOut(): Promise<void> {
  try {
    await auth.signOut()
  } catch {
    // Non-fatal
  }
  await router.replace({ name: 'admin-login' })
}
</script>
