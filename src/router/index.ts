import { createRouter, createWebHistory } from 'vue-router'

import AdminMonitorView from '@/views/AdminMonitorView.vue'
import ClientChatView from '@/views/ClientChatView.vue'
import ClientResumeView from '@/views/ClientResumeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/portal/chat/demo-token',
    },
    {
      path: '/admin/monitor',
      name: 'admin-monitor',
      component: AdminMonitorView,
    },
    {
      path: '/portal/chat/:magicToken?',
      name: 'portal-chat',
      component: ClientChatView,
    },
    {
      path: '/portal/resume',
      name: 'portal-resume',
      component: ClientResumeView,
    },
  ],
})

export default router
