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
        class="btn btn-sm gap-1.5 rounded-lg border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200"
        @click="router.push({ name: 'admin-monitor' })"
      >
        <PhArrowLeft :size="15" />
        <span class="hidden sm:inline">Monitor</span>
      </button>
    </template>

    <template #default>
      <div class="mx-auto flex w-full max-w-[800px] flex-col gap-5 p-3 md:p-5">

        <!-- ── Profile ─────────────────────────────────────────────── -->
        <div class="rounded-2xl border border-base-300/80 bg-base-100 p-5">
          <div class="mb-4">
            <h2 class="text-sm font-semibold text-base-content">Profile</h2>
            <p class="mt-0.5 text-xs text-base-content/55">Update your display name</p>
          </div>

          <form @submit.prevent="handleSaveProfile" class="flex flex-col gap-4">
            <label class="form-control">
              <div class="label pb-1">
                <span class="label-text text-xs font-medium">Display Name</span>
              </div>
              <input
                v-model="displayName"
                type="text"
                placeholder="Your name"
                :disabled="profileLoading"
                class="input input-bordered input-sm w-full max-w-xs"
              />
            </label>

            <div v-if="profileError" role="alert" class="alert alert-error py-2 text-sm max-w-xs">
              <PhWarning :size="15" aria-hidden="true" />
              <span>{{ profileError }}</span>
            </div>
            <div v-if="profileSuccess" role="alert" class="alert alert-success py-2 text-sm max-w-xs">
              <span>Display name saved.</span>
            </div>

            <div>
              <button
                type="submit"
                :disabled="profileLoading"
                class="btn btn-primary btn-sm"
              >
                <span v-if="profileLoading" class="loading loading-spinner loading-xs" aria-hidden="true"></span>
                {{ profileLoading ? 'Saving…' : 'Save Profile' }}
              </button>
            </div>
          </form>
        </div>

        <!-- ── Change Password ─────────────────────────────────────── -->
        <div class="rounded-2xl border border-base-300/80 bg-base-100 p-5">
          <div class="mb-4">
            <h2 class="text-sm font-semibold text-base-content">Change Password</h2>
            <p class="mt-0.5 text-xs text-base-content/55">Set a new password for your account</p>
          </div>

          <form @submit.prevent="handleChangePassword" class="flex flex-col gap-4">
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
                :disabled="passwordLoading"
                class="input input-bordered input-sm w-full max-w-xs"
              />
            </label>

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
                :disabled="passwordLoading"
                class="input input-bordered input-sm w-full max-w-xs"
              />
            </label>

            <div v-if="passwordError" role="alert" class="alert alert-error py-2 text-sm max-w-xs">
              <PhWarning :size="15" aria-hidden="true" />
              <span>{{ passwordError }}</span>
            </div>
            <div v-if="passwordSuccess" role="alert" class="alert alert-success py-2 text-sm max-w-xs">
              <span>Password updated successfully.</span>
            </div>

            <div>
              <button
                type="submit"
                :disabled="passwordLoading || !newPassword || !confirmPassword"
                class="btn btn-primary btn-sm"
              >
                <span v-if="passwordLoading" class="loading loading-spinner loading-xs" aria-hidden="true"></span>
                {{ passwordLoading ? 'Updating…' : 'Update Password' }}
              </button>
            </div>
          </form>
        </div>

        <!-- ── Account Info (read-only) ────────────────────────────── -->
        <div class="rounded-2xl border border-base-300/80 bg-base-100 p-5">
          <div class="mb-4">
            <h2 class="text-sm font-semibold text-base-content">Account</h2>
          </div>

          <div class="flex flex-col gap-4">
            <label class="form-control">
              <div class="label pb-1">
                <span class="label-text text-xs font-medium">Email</span>
              </div>
              <input
                :value="auth.userEmail ?? ''"
                type="email"
                readonly
                disabled
                class="input input-bordered input-sm w-full max-w-xs cursor-not-allowed opacity-70"
              />
            </label>

            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-base-content/55">Role</span>
              <span class="badge badge-sm rounded-full bg-primary/15 text-primary border-0">admin</span>
            </div>

            <p class="text-xs text-base-content/45 max-w-sm">
              Email changes require re-verification. Contact Supabase dashboard to update.
            </p>
          </div>
        </div>

        <!-- ── Client Authentication (info only) ──────────────────── -->
        <div class="rounded-2xl border border-base-300/80 bg-base-100 p-5">
          <div class="mb-3">
            <h2 class="text-sm font-semibold text-base-content">Client Authentication</h2>
          </div>

          <div class="flex items-start gap-3 rounded-xl border border-info/30 bg-info/8 px-4 py-3">
            <PhEnvelopeSimple :size="18" class="shrink-0 mt-0.5 text-info" aria-hidden="true" />
            <p class="text-sm text-base-content/70">
              Clients use <strong class="font-medium text-base-content">magic link (passwordless)</strong> authentication — they receive a one-time sign-in link by email.
              There are no passwords to reset. To give a client access again, resend their invite from the
              <button
                type="button"
                class="underline underline-offset-2 text-primary hover:text-primary/80 transition-colors"
                @click="router.push({ name: 'admin-clients' })"
              >Clients</button> page.
            </p>
          </div>
        </div>

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
  PhChatTeardropText,
  PhEnvelopeSimple,
  PhUserCircle,
  PhUsersThree,
  PhWarning,
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
    title: 'Portal',
    items: [{ label: 'Client Chat', to: '/portal/chat/demo-token', icon: PhChatTeardropText }],
  },
  {
    title: 'Account',
    items: [{ label: 'Account', to: '/admin/account', icon: PhUserCircle }],
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

// ── Handlers ──────────────────────────────────────────────────────────────────
async function handleSaveProfile(): Promise<void> {
  profileError.value = ''
  profileSuccess.value = false
  profileLoading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ data: { display_name: displayName.value } })
    if (error) throw error
    profileSuccess.value = true
  } catch (err: unknown) {
    profileError.value = err instanceof Error ? err.message : 'Failed to save profile. Please try again.'
  } finally {
    profileLoading.value = false
  }
}

async function handleChangePassword(): Promise<void> {
  passwordError.value = ''
  passwordSuccess.value = false

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match. Please try again.'
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
  } catch (err: unknown) {
    passwordError.value = err instanceof Error ? err.message : 'Failed to update password. Please try again.'
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
