<template>
  <div class="flex flex-1 flex-col overflow-y-auto">
    <div class="mx-auto w-full max-w-2xl px-4 py-10">

      <!-- Phase hero header -->
      <div class="mb-8 text-center">
        <span
          class="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
          :class="isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
        >
          <svg
            v-if="isComplete"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="h-4 w-4"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="h-4 w-4"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
              clip-rule="evenodd"
            />
          </svg>
          {{ isComplete ? 'Onboarding Complete' : 'In Review' }}
        </span>

        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          {{ isComplete ? 'Welcome aboard! 🎉' : 'Your onboarding information is complete!' }}
        </h1>
        <p class="mt-2 text-slate-500">
          {{
            isComplete
              ? 'Your onboarding has been finalised. Our team will reach out shortly with next steps.'
              : 'All four onboarding milestones have been captured. Our team is reviewing your information.'
          }}
        </p>
      </div>

      <!-- Brief card -->
      <div class="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-5 py-4">
          <h2 class="text-sm font-semibold text-slate-800">Your Onboarding Summary</h2>
          <p class="mt-0.5 text-xs text-slate-400">Personalised to your project — please review and confirm</p>
        </div>

        <!-- Generating skeleton -->
        <div v-if="isGenerating" class="space-y-3 px-5 py-5">
          <div class="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          <div class="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div class="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
          <div class="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div class="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
          <p class="pt-2 text-center text-xs text-slate-400">Generating your personalised summary…</p>
        </div>

        <!-- Brief content -->
        <div v-else-if="brief" class="px-5 py-5">
          <div
            class="prose prose-sm max-h-80 overflow-y-auto text-slate-700"
            v-html="renderedBrief"
          />

          <!-- Approve button (only when ready) -->
          <div v-if="brief.status === 'ready'" class="mt-5 flex justify-end">
            <button
              type="button"
              :disabled="approving"
              class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-60 cursor-pointer"
              @click="handleApprove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                <path
                  fill-rule="evenodd"
                  d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ approving ? 'Saving…' : 'Looks good — approve this summary' }}
            </button>
          </div>

          <!-- Approved state -->
          <div
            v-else-if="brief.status === 'client_approved' || brief.status === 'complete'"
            class="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 shrink-0">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                clip-rule="evenodd"
              />
            </svg>
            You approved this summary. Our team will be in touch shortly.
          </div>
        </div>
      </div>

      <!-- What happens next card -->
      <div class="rounded-xl border border-slate-200 bg-slate-50 px-5 py-5">
        <h3 class="mb-3 text-sm font-semibold text-slate-700">What happens next?</h3>
        <ol class="space-y-2">
          <li
            v-for="(step, i) in nextSteps"
            :key="i"
            class="flex items-start gap-3 text-sm text-slate-600"
          >
            <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">
              {{ i + 1 }}
            </span>
            {{ step }}
          </li>
        </ol>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { marked } from 'marked'
import type { OnboardingBrief, OnboardingState } from '@/contracts/api'

const props = defineProps<{
  onboardingState: OnboardingState
  brief: OnboardingBrief | null
  briefLoading: boolean
}>()

const emit = defineEmits<{
  approve: [briefId: string]
}>()

const approving = ref(false)

const isComplete = computed(() => props.onboardingState.phase === 'complete')

const isGenerating = computed(
  () => props.briefLoading || !props.brief || props.brief.status === 'generating',
)

const renderedBrief = computed(() =>
  props.brief ? marked.parse(props.brief.content) as string : '',
)

const nextSteps = computed(() => {
  if (isComplete.value) {
    return [
      'Your dedicated project manager will introduce themselves within 1 business day.',
      'A kick-off call will be scheduled to walk through the technical brief.',
      "You'll receive a project timeline and first deliverables within the first week.",
    ]
  }
  return [
    'Our team is reviewing your onboarding summary.',
    'Please review and approve the summary above.',
    'Once approved, a project manager will reach out to schedule a kick-off call.',
  ]
})

async function handleApprove() {
  if (!props.brief || approving.value) return
  approving.value = true
  try {
    emit('approve', props.brief.id)
  } finally {
    approving.value = false
  }
}
</script>
