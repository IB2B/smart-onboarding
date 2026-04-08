import { ref, watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export function useAutoScroll(containerRef: Ref<HTMLElement | null>) {
  const isNearBottom = ref(true)
  let currentEl: HTMLElement | null = null

  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    const el = containerRef.value
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }

  function onScroll() {
    const el = containerRef.value
    if (!el) return
    isNearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 100
  }

  // Watch for the scroll container appearing in the DOM (lives inside v-else, not mounted initially)
  watch(
    () => containerRef.value,
    (newEl, oldEl) => {
      if (oldEl) oldEl.removeEventListener('scroll', onScroll)
      if (newEl) {
        newEl.addEventListener('scroll', onScroll, { passive: true })
        currentEl = newEl
        // Scroll to bottom whenever the container first appears
        newEl.scrollTo({ top: newEl.scrollHeight, behavior: 'instant' })
      }
    },
    { flush: 'post' },
  )

  onUnmounted(() => {
    currentEl?.removeEventListener('scroll', onScroll)
  })

  return { isNearBottom, scrollToBottom }
}
