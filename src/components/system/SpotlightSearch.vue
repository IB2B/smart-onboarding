<template>
  <Teleport to="body">
    <Transition name="spotlight">
      <div v-if="open" class="spotlight-backdrop" @click.self="$emit('close')">
        <div class="spotlight-card" role="dialog" aria-modal="true" aria-label="Search">
          <div class="flex items-center gap-3 border-b border-[#e9ebf5] px-5 py-4">
            <PhMagnifyingGlass :size="20" class="shrink-0 text-slate-400" />
            <input
              ref="inputRef"
              v-model="query"
              class="w-full border-0 bg-transparent text-lg text-slate-700 placeholder:text-slate-400 focus:outline-none"
              placeholder="Search conversations, topics, commands..."
              type="text"
            />
            <kbd class="hidden shrink-0 rounded-md border border-[#e1e5ee] bg-[#f4f6fb] px-1.5 py-0.5 text-xs text-slate-400 sm:inline-block">
              ESC
            </kbd>
          </div>
          <div class="max-h-[320px] overflow-y-auto px-5 py-3">
            <p class="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Recent</p>
            <ul class="space-y-1">
              <li
                v-for="item in filteredItems"
                :key="item.id"
                class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-[#f4f6fb]"
              >
                <PhClockCounterClockwise :size="16" class="shrink-0 text-slate-400" />
                <span class="truncate">{{ item.label }}</span>
              </li>
            </ul>
            <p v-if="filteredItems.length === 0" class="py-6 text-center text-sm text-slate-400">
              No results found.
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { PhClockCounterClockwise, PhMagnifyingGlass } from '@phosphor-icons/vue'
import { useHotkey } from '@/composables/useHotkey'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const recentItems = [
  { id: '1', label: 'What is the onboarding timeline?' },
  { id: '2', label: 'Brand guidelines discussion' },
  { id: '3', label: 'Integration requirements for Stripe' },
  { id: '4', label: 'Target audience analysis' },
  { id: '5', label: 'Business model overview' },
]

const filteredItems = computed(() => {
  if (!query.value.trim()) return recentItems
  const q = query.value.toLowerCase()
  return recentItems.filter((item) => item.label.toLowerCase().includes(q))
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      query.value = ''
      nextTick(() => inputRef.value?.focus())
    }
  },
)

useHotkey({
  key: 'Escape',
  handler: () => {
    if (props.open) emit('close')
  },
})
</script>
