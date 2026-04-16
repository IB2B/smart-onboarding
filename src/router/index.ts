import { createRouter, createWebHistory } from 'vue-router'

import AdminLoginView from '@/views/AdminLoginView.vue'
import PortalLoginView from '@/views/PortalLoginView.vue'
import AdminMonitorView from '@/views/AdminMonitorView.vue'
import AdminClientsView from '@/views/AdminClientsView.vue'
import AdminClientDetailView from '@/views/AdminClientDetailView.vue'
import AdminAlertsView from '@/views/AdminAlertsView.vue'
import AdminAccountView from '@/views/AdminAccountView.vue'
import ClientChatView from '@/views/ClientChatView.vue'
import ClientResumeView from '@/views/ClientResumeView.vue'
import PortalAuthCallback from '@/views/PortalAuthCallback.vue'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    requiresRole?: 'admin'
    requiresPortalAuth?: boolean // allow if authenticated client OR legacy magicToken param present
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: { name: 'admin-login' },
    },
    {
      path: '/portal/auth/callback',
      name: 'portal-auth-callback',
      component: PortalAuthCallback,
      meta: { public: true },
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: AdminLoginView,
      meta: { public: true },
    },
    {
      path: '/admin/monitor',
      name: 'admin-monitor',
      component: AdminMonitorView,
      meta: { requiresRole: 'admin' },
    },
    {
      path: '/admin/clients',
      name: 'admin-clients',
      component: AdminClientsView,
      meta: { requiresRole: 'admin' },
    },
    {
      path: '/admin/clients/:id',
      name: 'admin-client-detail',
      component: AdminClientDetailView,
      meta: { requiresRole: 'admin' },
    },
    {
      path: '/admin/alerts',
      name: 'admin-alerts',
      component: AdminAlertsView,
      meta: { requiresRole: 'admin' },
    },
    {
      path: '/admin/account',
      name: 'admin-account',
      component: AdminAccountView,
      meta: { requiresRole: 'admin' },
    },
    {
      path: '/portal/chat/:magicToken?',
      name: 'portal-chat',
      component: ClientChatView,
      meta: { requiresPortalAuth: true },
    },
    {
      path: '/portal/resume',
      name: 'portal-resume',
      component: ClientResumeView,
      meta: { public: true },
    },
    {
      path: '/portal/login',
      name: 'portal-login',
      component: PortalLoginView,
      meta: { public: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'admin-login' },
    },
  ],
})

// Resolved lazily on first navigation (Pinia must be installed before the first navigation fires)
let _auth: ReturnType<typeof useAuthStore> | null = null

router.beforeEach(async (to) => {
  _auth ??= useAuthStore()
  const auth = _auth

  // Await auth initialization (singleton — safe to call from guard + views simultaneously)
  await auth.init()

  // Public routes — always allow, but redirect authenticated admins away from portal login
  if (to.meta.public) {
    if (to.name === 'portal-login' && auth.isAuthenticated) {
      if (auth.isAdmin) return { name: 'admin-monitor' }
      return { name: 'portal-chat' }
    }
    return true
  }

  // Portal routes — allow if authenticated OR a magic token is present in the URL
  if (to.meta.requiresPortalAuth) {
    if (to.params['magicToken']) return true
    if (auth.isAuthenticated && !auth.isAdmin) return true
    return { name: 'portal-login' }
  }

  // Protected route — must be authenticated
  if (!auth.isAuthenticated) return { name: 'admin-login' }

  // Admin-only route — must have admin role
  if (to.meta.requiresRole === 'admin' && !auth.isAdmin) return { name: 'admin-login' }

  return true
})

export default router
