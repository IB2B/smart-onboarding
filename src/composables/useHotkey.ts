import { getCurrentInstance, onMounted, onUnmounted } from 'vue'

type Modifier = 'ctrl' | 'shift' | 'alt'

/**
 * Registers a global keydown shortcut that is automatically cleaned up when the
 * component that calls this composable is unmounted.
 *
 * NOTE: `ctrl` is treated as cross-platform — on macOS, both Ctrl and Cmd
 * (metaKey) satisfy the `ctrl` modifier. This is intentional so that
 * `modifiers: ['ctrl']` works as Cmd+K on macOS and Ctrl+K on Windows/Linux.
 *
 * Must be called inside a component's setup() function.
 */
export function useHotkey(options: { key: string; modifiers?: Modifier[]; handler: (e: KeyboardEvent) => void }) {
  if (import.meta.env.DEV && !getCurrentInstance()) {
    console.warn('[useHotkey] must be called inside a component setup() function.')
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key.toLowerCase() !== options.key.toLowerCase()) return

    const mods = options.modifiers ?? []
    const needsCtrl = mods.includes('ctrl')
    const needsShift = mods.includes('shift')
    const needsAlt = mods.includes('alt')

    // 'ctrl' matches either Ctrl (Windows/Linux) or Cmd/Meta (macOS)
    const ctrlSatisfied = needsCtrl ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey)

    if (!ctrlSatisfied) return
    if (needsShift !== e.shiftKey) return
    if (needsAlt !== e.altKey) return

    e.preventDefault()
    options.handler(e)
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
}
