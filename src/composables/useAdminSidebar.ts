import { computed } from 'vue'
import type { Ref } from 'vue'
import { PhBell, PhChartLineUp, PhUserCircle, PhUsersThree } from '@phosphor-icons/vue'

import type { AdminSidebarSection } from '@/components/admin/AdminSidebar.vue'

export type AdminNavKey = 'monitor' | 'clients' | 'alerts' | 'account'

export interface AdminSidebarBadges {
  clients?: Ref<number>
  alerts?: Ref<number>
}

export function useAdminSidebar(activeKey: AdminNavKey, badges: AdminSidebarBadges = {}) {
  return computed<AdminSidebarSection[]>(() => [
    {
      title: 'Monitor',
      items: [
        {
          label: 'Overview',
          to: '/admin/monitor',
          icon: PhChartLineUp,
          active: activeKey === 'monitor',
        },
        {
          label: 'Clients',
          to: '/admin/clients',
          icon: PhUsersThree,
          active: activeKey === 'clients',
          badge: badges.clients !== undefined ? String(badges.clients.value) : undefined,
        },
        {
          label: 'Alerts',
          to: '/admin/alerts',
          icon: PhBell,
          active: activeKey === 'alerts',
          badge: badges.alerts !== undefined ? String(badges.alerts.value) : undefined,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Account',
          to: '/admin/account',
          icon: PhUserCircle,
          active: activeKey === 'account',
        },
      ],
    },
  ])
}
