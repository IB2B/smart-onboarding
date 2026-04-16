<template>
  <section class="flex flex-col gap-3" aria-label="Admin KPI strip">

    <!-- Tier 1: Featured metrics — toned, taller cards -->
    <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
      <article
        v-for="m in primaryMetrics"
        :key="m.label"
        :aria-label="`${m.label}: ${m.value}`"
        class="relative overflow-hidden rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md"
        :class="m.cardClass"
      >
        <!-- Decorative corner circles (21st.dev KpiCard pattern) -->
        <span class="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-black/5" aria-hidden="true" />
        <span class="pointer-events-none absolute -right-2 -top-2 h-8 w-8 rounded-full bg-black/5" aria-hidden="true" />

        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[11px] font-semibold uppercase tracking-[0.16em]" :class="m.labelClass">{{ m.label }}</p>
            <!-- Loading skeleton -->
            <div v-if="loading" class="mt-2 h-10 w-20 animate-pulse rounded-lg bg-black/10" />
            <p v-else class="mt-2 text-[40px] font-semibold leading-none tracking-[-0.04em]" :class="m.valueClass">
              {{ m.value }}
            </p>
            <p class="mt-1.5 text-xs" :class="m.helpTextClass">{{ m.helpText }}</p>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-2">
            <span class="inline-flex min-w-[5.5rem] items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]" :class="m.badgeClass">
              {{ m.badge }}
            </span>
            <div class="flex h-9 w-9 items-center justify-center rounded-xl" :class="m.iconBg">
              <component :is="m.icon" :size="18" weight="fill" :class="m.iconColor" />
            </div>
          </div>
        </div>

        <!-- Baseline bar -->
        <div class="mt-4 h-0.5 w-12 rounded opacity-30" :class="m.barClass" />
      </article>
    </div>

    <!-- Tier 2: Secondary stats — compact horizontal cards -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <article
        v-for="m in secondaryMetrics"
        :key="m.label"
        :aria-label="`${m.label}: ${m.value}`"
        class="flex items-center gap-3 rounded-xl border border-base-300/80 bg-base-100 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      >
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" :class="m.iconBg">
          <component :is="m.icon" :size="16" weight="fill" :class="m.iconColor" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-base-content/48">{{ m.label }}</p>
          <div v-if="loading" class="mt-0.5 h-5 w-12 animate-pulse rounded bg-base-200" />
          <p v-else class="aura-heading text-[22px] font-semibold leading-tight tracking-[-0.03em] text-base-content">
            {{ m.value }}
          </p>
        </div>
        <span class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]" :class="m.badgeClass">
          {{ m.badge }}
        </span>
      </article>
    </div>

  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import {
  PhChartLine,
  PhCheckCircle,
  PhClock,
  PhEnvelopeSimple,
  PhLockSimple,
  PhPulse,
} from '@phosphor-icons/vue'

const props = defineProps<{
  loading?: boolean
  summary: {
    active: number
    invited: number
    blocked: number
    completionAverage: number
    staleClients: number
    ingestHealth: number
  }
}>()

interface PrimaryMetric {
  label: string
  value: string | number
  helpText: string
  badge: string
  badgeClass: string
  icon: Component
  cardClass: string
  valueClass: string
  labelClass: string
  helpTextClass: string
  iconBg: string
  iconColor: string
  barClass: string
}

interface SecondaryMetric {
  label: string
  value: string | number
  badge: string
  badgeClass: string
  icon: Component
  iconBg: string
  iconColor: string
}

const primaryMetrics = computed<PrimaryMetric[]>(() => [
  {
    label: 'Active Clients',
    value: props.summary.active,
    helpText: 'Clients currently active',
    badge: 'live',
    badgeClass: 'bg-success text-success-content ring-1 ring-inset ring-success-content/10',
    icon: PhCheckCircle,
    cardClass: 'bg-success/10 border border-success/25',
    valueClass: 'text-success-content',
    labelClass: 'text-success-content/70',
    helpTextClass: 'text-success-content/60',
    iconBg: 'bg-success/25',
    iconColor: 'text-success-content',
    barClass: 'bg-success-content',
  },
  {
    label: 'Blocked',
    value: props.summary.blocked,
    helpText: 'Need manual intervention',
    badge: 'review',
    badgeClass: 'bg-error text-error-content ring-1 ring-inset ring-error-content/10',
    icon: PhLockSimple,
    cardClass: 'bg-error/10 border border-error/25',
    valueClass: 'text-error-content',
    labelClass: 'text-error-content/70',
    helpTextClass: 'text-error-content/60',
    iconBg: 'bg-error/20',
    iconColor: 'text-error-content',
    barClass: 'bg-error-content',
  },
  {
    label: 'Ingest Health',
    value: `${props.summary.ingestHealth}%`,
    helpText: 'Signal quality score',
    badge: props.summary.ingestHealth >= 80 ? 'healthy' : props.summary.ingestHealth >= 50 ? 'degraded' : 'critical',
    badgeClass: props.summary.ingestHealth >= 80
      ? 'bg-primary/18 text-primary ring-1 ring-inset ring-primary/15'
      : props.summary.ingestHealth >= 50
        ? 'bg-warning text-warning-content ring-1 ring-inset ring-warning-content/10'
        : 'bg-error text-error-content ring-1 ring-inset ring-error-content/10',
    icon: PhPulse,
    cardClass: 'bg-primary/10 border border-primary/20',
    valueClass: 'text-primary',
    labelClass: 'text-primary/70',
    helpTextClass: 'text-primary/72',
    iconBg: 'bg-primary/20',
    iconColor: 'text-primary',
    barClass: 'bg-primary',
  },
])

const secondaryMetrics = computed<SecondaryMetric[]>(() => [
  {
    label: 'Invited',
    value: props.summary.invited,
    badge: 'waiting',
    badgeClass: 'bg-info text-info-content ring-1 ring-inset ring-info-content/10',
    icon: PhEnvelopeSimple,
    iconBg: 'bg-info/15',
    iconColor: 'text-info-content',
  },
  {
    label: 'Completion avg',
    value: `${props.summary.completionAverage}%`,
    badge: 'avg',
    badgeClass: 'bg-base-200 text-base-content/72 ring-1 ring-inset ring-base-content/8',
    icon: PhChartLine,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    label: 'Stale Clients',
    value: props.summary.staleClients,
    badge: 'stale',
    badgeClass: 'bg-warning text-warning-content ring-1 ring-inset ring-warning-content/10',
    icon: PhClock,
    iconBg: 'bg-warning/15',
    iconColor: 'text-warning-content',
  },
])
</script>
