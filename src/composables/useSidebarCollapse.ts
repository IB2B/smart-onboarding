import { type InjectionKey, type Ref, inject, provide, ref } from 'vue'

interface SidebarState {
  collapsed: Ref<boolean>
  toggle: () => void
}

const SIDEBAR_KEY: InjectionKey<SidebarState> = Symbol('sidebar-collapse')

export function useSidebarProvider(initialCollapsed = true): SidebarState {
  const collapsed = ref(initialCollapsed)
  const toggle = () => {
    collapsed.value = !collapsed.value
  }
  const state: SidebarState = { collapsed, toggle }
  provide(SIDEBAR_KEY, state)
  return state
}

export function useSidebarState(): SidebarState {
  const state = inject(SIDEBAR_KEY)
  if (!state) {
    if (import.meta.env.DEV) {
      console.warn('[useSidebarState] No sidebar provider found in ancestor tree.')
    }
    return { collapsed: ref(false), toggle: () => {} }
  }
  return state
}
