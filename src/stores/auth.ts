import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Session, Subscription, User } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const role = ref<'admin' | 'client' | null>(null)
  const loading = ref(true)

  // Internal: ensure init() only runs once; multiple callers await the same promise
  let initPromise: Promise<void> | null = null
  let _authSubscription: Subscription | null = null

  // Computeds
  const isAuthenticated = computed(() => !!session.value)
  const isAdmin = computed(() => role.value === 'admin')
  const userEmail = computed(() => user.value?.email ?? null)

  // Private helpers
  function setSession(s: Session): void {
    session.value = s
    user.value = s.user
    role.value = (s.user.app_metadata?.['role'] as 'admin' | 'client' | undefined) ?? 'client'
  }

  function clearSession(): void {
    session.value = null
    user.value = null
    role.value = null
  }

  // init — call once at app startup; router guard awaits this
  function init(): Promise<void> {
    if (initPromise) return initPromise
    initPromise = (async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (data.session) setSession(data.session)
      } finally {
        loading.value = false
      }
      // Listen for future auth changes (subscription stored to avoid duplicate listeners on HMR)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (newSession) setSession(newSession)
        else clearSession()
      })
      // In production the store lives for the full app lifetime; subscription is kept alive intentionally.
      // In tests or Storybook, call destroy() to prevent leaks.
      _authSubscription = subscription
    })()
    return initPromise
  }

  // Exposed for test teardown only — not needed in normal app usage
  function destroy(): void {
    _authSubscription?.unsubscribe()
    _authSubscription = null
    initPromise = null
    clearSession()
    loading.value = true
  }

  async function signInAdmin(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function sendMagicLink(email: string, redirectTo: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) throw error
  }

  async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    // onAuthStateChange fires SIGNED_OUT and calls clearSession() automatically
  }

  return {
    // State
    user,
    session,
    role,
    loading,
    // Computeds
    isAuthenticated,
    isAdmin,
    userEmail,
    // Actions
    init,
    signInAdmin,
    sendMagicLink,
    signOut,
    destroy,
  }
})
