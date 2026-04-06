import type {
  AdminDocumentChunkRecord,
  AdminSeedRecord,
  ChatSessionResponse,
  ClientSummary,
  MilestoneMap,
  OnboardingState,
  ThreadMessage,
} from '@/contracts/api'

export const mockClients: ClientSummary[] = [
  {
    id: 'cl_1',
    company: 'Northstar Dental',
    contactName: 'Mina Ghazali',
    email: 'mina@northstar.dental',
    status: 'active',
    progress: 62,
    lastActivity: '2h ago',
  },
  {
    id: 'cl_2',
    company: 'Atlas Mobility',
    contactName: 'Rayan Oumaima',
    email: 'rayan@atlasmobility.io',
    status: 'invited',
    progress: 18,
    lastActivity: '1d ago',
  },
  {
    id: 'cl_3',
    company: 'Bloom Commerce',
    contactName: 'Kenza Amar',
    email: 'kenza@bloomcommerce.co',
    status: 'blocked',
    progress: 41,
    lastActivity: '3d ago',
  },
]

const sharedMilestones: MilestoneMap = {
  brand_identity: {
    status: 'complete',
    data: {
      tone: 'premium calm minimal',
      logo: 'primary mark locked',
    },
  },
  technical_needs: {
    status: 'complete',
    data: {
      stack: ['HubSpot', 'Calendly', 'Stripe'],
      integrations: 3,
    },
  },
  target_audience: {
    status: 'complete',
    data: {
      segments: ['Families', 'corporate wellness clients'],
    },
  },
  timeline_budget: {
    status: 'pending',
    data: {
      launchWindow: null,
      budgetConfirmed: false,
    },
  },
}

export const mockOnboardingStates: OnboardingState[] = [
  {
    id: 'os_1',
    clientId: 'cl_1',
    phase: 'target_audience',
    milestones: sharedMilestones,
    collectedData: {
      businessModel: 'Private clinic with membership programs',
      brandDirection: 'Premium calm minimal',
      targetAudience: 'Families + corporate wellness clients',
      requiredIntegrations: ['HubSpot', 'Calendly', 'Stripe'],
      pendingItems: ['Upload brand assets', 'Confirm monthly traffic baseline'],
    },
    status: 'active',
    lastActivity: '2026-04-04T10:14:00.000Z',
  },
  {
    id: 'os_2',
    clientId: 'cl_2',
    phase: 'welcome',
    milestones: {
      brand_identity: {
        status: 'pending',
        data: { tone: 'not yet collected' },
      },
      technical_needs: {
        status: 'pending',
        data: { stack: [] },
      },
      target_audience: {
        status: 'pending',
        data: { segments: [] },
      },
      timeline_budget: {
        status: 'pending',
        data: { launchWindow: null, budgetConfirmed: false },
      },
    },
    collectedData: {
      businessModel: 'Fleet operations platform',
      pendingItems: ['Magic link accepted', 'Discovery call not yet scheduled'],
    },
    status: 'active',
    lastActivity: '2026-04-03T10:00:00.000Z',
  },
  {
    id: 'os_3',
    clientId: 'cl_3',
    phase: 'technical_needs',
    milestones: {
      brand_identity: {
        status: 'complete',
        data: { tone: 'editorial and sharp' },
      },
      technical_needs: {
        status: 'in_progress',
        data: { cms: 'unknown', payments: 'pending review' },
      },
      target_audience: {
        status: 'pending',
        data: { segments: [] },
      },
      timeline_budget: {
        status: 'pending',
        data: { launchWindow: null, budgetConfirmed: false },
      },
    },
    collectedData: {
      businessModel: 'Commerce brand',
      pendingItems: ['Confirm CMS constraints', 'Validate payment provider'],
    },
    status: 'paused',
    lastActivity: '2026-03-31T08:55:00.000Z',
  },
]

export const mockAdminDataSeeds: AdminSeedRecord[] = [
  {
    id: 'seed_1',
    clientId: 'cl_1',
    title: 'Brand workshop notes',
    sourceType: 'notes',
    rawTranscript: 'Tone direction, patient trust language, and launch sequencing notes.',
    processedSummary: 'Premium calm positioning with conversion-focused booking path.',
    createdBy: 'admin_1',
    createdAt: '2026-04-03T08:40:00.000Z',
  },
  {
    id: 'seed_2',
    clientId: 'cl_1',
    title: 'Discovery call transcript',
    sourceType: 'audio',
    storagePath: 'raw-uploads/northstar/discovery-call.m4a',
    rawTranscript: 'Transcript extracted from the latest call. Looking for follow-up on analytics.',
    createdBy: 'admin_1',
    createdAt: '2026-04-03T09:10:00.000Z',
  },
  {
    id: 'seed_3',
    clientId: 'cl_2',
    title: 'Website brief link',
    sourceType: 'url',
    storagePath: 'https://atlasmobility.io/brief',
    createdBy: 'admin_2',
    createdAt: '2026-04-02T12:20:00.000Z',
  },
  {
    id: 'seed_4',
    clientId: 'cl_3',
    title: 'Legacy CMS export',
    sourceType: 'document',
    storagePath: 'raw-uploads/bloom/legacy-cms-export.pdf',
    rawTranscript: 'Export includes taxonomy notes, payment gateway references, and migration concerns.',
    processedSummary: 'Needs review due to CMS and payment ambiguity.',
    createdBy: 'admin_3',
    createdAt: '2026-03-31T09:00:00.000Z',
  },
]

export const mockDocumentChunks: AdminDocumentChunkRecord[] = [
  {
    id: 'chunk_1',
    seedId: 'seed_1',
    clientId: 'cl_1',
    content: 'Brand direction favors premium calm language with low-friction scheduling.',
    chunkIndex: 0,
    metadata: {
      sourceType: 'notes',
      similarity: 0.94,
    },
    createdAt: '2026-04-03T08:45:00.000Z',
  },
  {
    id: 'chunk_2',
    seedId: 'seed_1',
    clientId: 'cl_1',
    content: 'Patient onboarding should preserve trust and simplify the first appointment path.',
    chunkIndex: 1,
    metadata: {
      sourceType: 'notes',
      similarity: 0.91,
    },
    createdAt: '2026-04-03T08:46:00.000Z',
  },
  {
    id: 'chunk_3',
    seedId: 'seed_4',
    clientId: 'cl_3',
    content: 'Legacy CMS constraints block confident handoff until platform ownership is confirmed.',
    chunkIndex: 0,
    metadata: {
      sourceType: 'document',
      similarity: 0.74,
    },
    createdAt: '2026-03-31T09:30:00.000Z',
  },
]

export interface MockThreadByClient {
  cl_1: ThreadMessage[]
  cl_2: ThreadMessage[]
  cl_3: ThreadMessage[]
}

export const mockThreadByClient: MockThreadByClient = {
  cl_1: [
    {
      id: 'm1',
      role: 'assistant',
      content:
        'Welcome Mina. I reviewed your brief and see premium patient onboarding and appointment flows are a priority. Should we define the brand tone first or map conversion pages first?',
      createdAt: '2026-04-03T09:14:00.000Z',
    },
    {
      id: 'm2',
      role: 'client',
      content: 'Let us lock brand tone and voice first, then conversion pages.',
      createdAt: '2026-04-03T09:16:00.000Z',
    },
    {
      id: 'm3',
      role: 'operator',
      content: 'Admin note: seed quality is good, still missing current analytics baseline.',
      createdAt: '2026-04-03T09:22:00.000Z',
    },
  ],
  cl_2: [
    {
      id: 'm4',
      role: 'assistant',
      content:
        'Hi Rayan, once you open your magic link we can collect your fleet operations needs and reporting requirements quickly.',
      createdAt: '2026-04-02T11:10:00.000Z',
    },
  ],
  cl_3: [
    {
      id: 'm5',
      role: 'assistant',
      content: 'We still need existing CMS and payment-provider constraints to finalize your architecture.',
      createdAt: '2026-03-31T09:10:00.000Z',
    },
  ],
}

export const mockMessagesByClient: MockThreadByClient = structuredClone(mockThreadByClient)

export const mockPortalSession: ChatSessionResponse = {
  session: {
    clientId: 'cl_1',
    title: 'Aura onboarding session',
    messages: [
      {
        id: 'msg_1',
        role: 'assistant',
        content:
          "Welcome to Aura Onboarding! I'm here to guide you through setting up your workspace. Let's start by understanding your brand.",
        createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      },
      {
        id: 'msg_2',
        role: 'client',
        content: 'Hi! Excited to get started.',
        createdAt: new Date(Date.now() - 4 * 60_000).toISOString(),
      },
    ],
  },
  snapshot: {
    businessModel: 'Private clinic with membership programs',
    brandDirection: 'Premium calm minimal',
    targetAudience: 'Families + corporate wellness clients',
    requiredIntegrations: ['HubSpot', 'Calendly', 'Stripe'],
    pendingItems: ['Upload brand assets', 'Confirm monthly traffic baseline'],
  },
}
