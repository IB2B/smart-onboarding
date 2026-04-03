import type { ChatSessionResponse, ClientSummary, ThreadMessage } from '@/contracts/api'

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

export const mockThreadByClient: Record<string, ThreadMessage[]> = {
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
