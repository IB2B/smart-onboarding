<template>
  <div class="space-y-5">

    <!-- Generating skeleton -->
    <div v-if="allGenerating" class="space-y-3 py-4">
      <div class="h-3 w-1/3 animate-pulse rounded bg-base-300/60" />
      <div class="h-3 w-full animate-pulse rounded bg-base-300/60" />
      <div class="h-3 w-4/5 animate-pulse rounded bg-base-300/60" />
      <div class="h-3 w-full animate-pulse rounded bg-base-300/60" />
      <p class="pt-1 text-center text-xs text-base-content/40">Generating onboarding briefs…</p>
    </div>

    <!-- Two-column brief grid -->
    <div v-else class="grid gap-4 lg:grid-cols-2">
      <!-- Technical Brief -->
      <div class="overflow-hidden rounded-xl border border-base-300/80 bg-base-100">
        <div class="flex items-center justify-between border-b border-base-300/60 px-4 py-3">
          <span class="text-sm font-semibold text-base-content">Technical Brief</span>
          <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold" :class="statusBadge(technicalBrief)">
            {{ statusLabel(technicalBrief) }}
          </span>
        </div>
        <div class="max-h-72 overflow-y-auto px-4 py-4">
          <template v-if="technicalBrief?.status === 'generating'">
            <div class="space-y-2">
              <div v-for="n in 5" :key="n" class="h-2.5 animate-pulse rounded bg-base-300/60" />
            </div>
          </template>
          <div
            v-else-if="technicalBrief"
            class="prose prose-xs text-xs leading-relaxed text-base-content/80"
            v-html="renderedTechnical"
          />
          <p v-else class="text-xs text-base-content/40">No technical brief available yet.</p>
        </div>
      </div>

      <!-- Non-Technical Brief -->
      <div class="overflow-hidden rounded-xl border border-base-300/80 bg-base-100">
        <div class="flex items-center justify-between border-b border-base-300/60 px-4 py-3">
          <span class="text-sm font-semibold text-base-content">Client Summary</span>
          <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold" :class="statusBadge(nonTechnicalBrief)">
            {{ statusLabel(nonTechnicalBrief) }}
          </span>
        </div>
        <div class="max-h-72 overflow-y-auto px-4 py-4">
          <template v-if="nonTechnicalBrief?.status === 'generating'">
            <div class="space-y-2">
              <div v-for="n in 5" :key="n" class="h-2.5 animate-pulse rounded bg-base-300/60" />
            </div>
          </template>
          <div
            v-else-if="nonTechnicalBrief"
            class="prose prose-xs text-xs leading-relaxed text-base-content/80"
            v-html="renderedNonTechnical"
          />
          <p v-else class="text-xs text-base-content/40">No client summary available yet.</p>
        </div>
      </div>
    </div>

    <!-- Mark Complete button -->
    <div v-if="!allGenerating" class="flex items-center justify-between pt-1">
      <p class="text-xs text-base-content/40">
        <template v-if="nonTechnicalBrief?.status === 'client_approved'">
          Client has approved the summary.
        </template>
        <template v-else-if="nonTechnicalBrief?.status === 'ready'">
          Awaiting client approval.
        </template>
      </p>
      <button
        type="button"
        :disabled="!canComplete"
        class="btn btn-sm btn-primary rounded-lg cursor-pointer disabled:opacity-50"
        @click="emit('complete-onboarding')"
      >
        Mark Onboarding Complete
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import type { OnboardingBrief } from '@/contracts/api'

const props = defineProps<{
  briefs: OnboardingBrief[]
}>()

const emit = defineEmits<{
  'complete-onboarding': []
}>()

const technicalBrief = computed(() => props.briefs.find((b) => b.briefType === 'technical') ?? null)
const nonTechnicalBrief = computed(() => props.briefs.find((b) => b.briefType === 'non_technical') ?? null)

const renderedTechnical = computed(() =>
  technicalBrief.value ? marked.parse(technicalBrief.value.content) as string : '',
)
const renderedNonTechnical = computed(() =>
  nonTechnicalBrief.value ? marked.parse(nonTechnicalBrief.value.content) as string : '',
)

const allGenerating = computed(
  () =>
    props.briefs.length === 0 ||
    props.briefs.every((b) => b.status === 'generating'),
)

const canComplete = computed(() => {
  const statuses: OnboardingBrief['status'][] = ['ready', 'client_approved', 'complete']
  return props.briefs.some((b) => statuses.includes(b.status))
})

function statusLabel(brief: OnboardingBrief | null): string {
  if (!brief) return 'Pending'
  const map: Record<OnboardingBrief['status'], string> = {
    generating: 'Generating…',
    ready: 'Ready',
    client_approved: 'Approved',
    complete: 'Complete',
  }
  return map[brief.status]
}

function statusBadge(brief: OnboardingBrief | null): string {
  if (!brief || brief.status === 'generating') return 'bg-amber-100 text-amber-700'
  if (brief.status === 'ready') return 'bg-blue-100 text-blue-700'
  if (brief.status === 'client_approved') return 'bg-violet-100 text-violet-700'
  return 'bg-emerald-100 text-emerald-700'
}
</script>
