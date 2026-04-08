<template>
  <div class="relative mt-auto pt-3">
    <!-- Backdrop to close menu on outside click -->
    <div
      v-if="menuOpen"
      class="fixed inset-0 z-10"
      aria-hidden="true"
      @click="menuOpen = false"
    />

    <!-- Dropdown menu (above the dock) -->
    <Transition name="fade">
      <div
        v-if="menuOpen && !collapsed"
        class="absolute bottom-full left-0 right-0 z-20 mb-1.5 rounded-xl border border-base-300/80 bg-base-100 py-1 shadow-lg"
        role="menu"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-error hover:bg-error/8 transition-colors duration-100"
          role="menuitem"
          @click="onSignOut"
        >
          <PhSignOut :size="15" />
          Sign out
        </button>
      </div>
    </Transition>

    <!-- Collapsed: menu floats to the right -->
    <Transition name="fade">
      <div
        v-if="menuOpen && collapsed"
        class="absolute bottom-0 left-full z-20 ml-1.5 rounded-xl border border-base-300/80 bg-base-100 py-1 shadow-lg min-w-[140px]"
        role="menu"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium text-error hover:bg-error/8 transition-colors duration-100"
          role="menuitem"
          @click="onSignOut"
        >
          <PhSignOut :size="15" />
          Sign out
        </button>
      </div>
    </Transition>

    <!-- Dock trigger -->
    <button
      type="button"
      class="w-full rounded-xl border border-base-300/60 bg-base-100 px-2.5 pb-2.5 pt-2.5 shadow-sm hover:bg-base-200/40 transition-colors duration-100"
      :aria-expanded="menuOpen"
      aria-haspopup="true"
      aria-label="Account menu"
      @click="menuOpen = !menuOpen"
    >
      <div v-if="collapsed" class="flex justify-center">
        <div
          class="size-10 aspect-square shrink-0 rounded-full border border-base-300/60 bg-[linear-gradient(145deg,#e7ecff,#cad6ff)]"
          role="img"
          :aria-label="name"
        />
      </div>
      <div v-else class="flex items-center gap-3">
        <div class="size-10 aspect-square shrink-0 rounded-full border border-base-300/60 bg-[linear-gradient(145deg,#e7ecff,#cad6ff)]" />
        <div class="min-w-0">
          <p class="truncate text-[13px] font-medium tracking-[-0.01em] text-[#252a37]">{{ name }}</p>
          <p class="truncate text-[11px] text-slate-500">{{ detail }}</p>
        </div>
        <PhCaretDown
          :size="14"
          class="ml-auto shrink-0 text-slate-400 opacity-90 transition-transform duration-150"
          :class="menuOpen ? 'rotate-180' : ''"
        />
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSidebarState } from '@/composables/useSidebarCollapse'
import { PhCaretDown, PhSignOut } from '@phosphor-icons/vue'

defineProps<{
  name: string
  detail: string
}>()

const emit = defineEmits<{
  'sign-out': []
}>()

const { collapsed } = useSidebarState()
const menuOpen = ref(false)

function onSignOut(): void {
  menuOpen.value = false
  emit('sign-out')
}
</script>
