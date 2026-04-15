import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import type { LlmToolCall, ToolResult } from './types.ts'
import type { ToolDefinition } from './llm.ts'

export type { ToolDefinition }

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'render_widget',
      description:
        'Render an interactive UI widget in the chat for structured data collection. Use this instead of asking the user to type structured answers when presenting choices, scales, dates, or file uploads.',
      parameters: {
        type: 'object',
        properties: {
          widget_type: {
            type: 'string',
            enum: ['choices', 'scale', 'calendar', 'file-drop'],
            description: 'The type of interactive widget to render',
          },
          prompt: {
            type: 'string',
            description: 'The question or instruction shown above the widget',
          },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                description: { type: 'string' },
              },
              required: ['id', 'label'],
            },
            description: 'Required for choices widget — the selectable options',
          },
          min: { type: 'number', description: 'Minimum value (scale widget)' },
          max: { type: 'number', description: 'Maximum value (scale widget)' },
          step: { type: 'number', description: 'Step increment (scale widget)' },
          min_label: { type: 'string', description: 'Label for minimum end (scale widget)' },
          max_label: { type: 'string', description: 'Label for maximum end (scale widget)' },
          unit: { type: 'string', description: 'Unit suffix (scale widget, e.g. "k/mo")' },
          min_date: { type: 'string', description: 'Earliest selectable date ISO string (calendar widget)' },
          max_date: { type: 'string', description: 'Latest selectable date ISO string (calendar widget)' },
          accept: {
            type: 'array',
            items: { type: 'string' },
            description: 'Accepted file extensions (file-drop widget)',
          },
          max_files: { type: 'integer', description: 'Max number of files (file-drop widget)' },
        },
        required: ['widget_type', 'prompt'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_milestone',
      description:
        'Mark an onboarding milestone as complete and advance to the next phase. Call this when you have collected sufficient information for the current milestone.',
      parameters: {
        type: 'object',
        properties: {
          milestone: {
            type: 'string',
            enum: ['brand_identity', 'technical_needs', 'target_audience', 'timeline_budget'],
            description: 'The milestone being completed',
          },
          summary: {
            type: 'string',
            description: 'A brief summary of what was collected for this milestone',
          },
        },
        required: ['milestone', 'summary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_collected_data',
      description:
        'Persist a structured fact collected from the client. Use this to save specific information like business model, brand preferences, target audience, tech stack, budget, etc.',
      parameters: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            description:
              'The data field name (e.g. businessModel, brandDirection, targetAudience, requiredIntegrations, budget)',
          },
          value: {
            description: 'The value to store — can be a string, number, array, or object',
          },
        },
        required: ['field', 'value'],
      },
    },
  },
]

const MILESTONE_ORDER = ['brand_identity', 'technical_needs', 'target_audience', 'timeline_budget'] as const

function nextPhase(
  milestones: Record<string, { status: string; data: Record<string, unknown> }>,
  completedMilestone: string,
): string {
  const updatedMilestones = { ...milestones, [completedMilestone]: { ...milestones[completedMilestone], status: 'complete' } }
  const nextIncomplete = MILESTONE_ORDER.find(
    (key) => key !== completedMilestone && updatedMilestones[key]?.status !== 'complete',
  )
  return nextIncomplete ?? 'review'
}

export async function executeTool(
  supabase: SupabaseClient,
  clientId: string,
  toolCall: LlmToolCall,
  currentMilestones: Record<string, { status: string; data: Record<string, unknown> }>,
): Promise<ToolResult> {
  const { name, arguments: argsJson } = toolCall.function
  let args: Record<string, unknown>
  try {
    args = JSON.parse(argsJson) as Record<string, unknown>
  } catch {
    return { toolCallId: toolCall.id, result: `Error: invalid JSON arguments for tool ${name}` }
  }

  if (name === 'render_widget') {
    const widgetType = args['widget_type'] as string
    let widgetPayload: unknown

    if (widgetType === 'choices') {
      widgetPayload = {
        type: 'choices',
        prompt: args['prompt'],
        options: args['options'] ?? [],
      }
    } else if (widgetType === 'scale') {
      widgetPayload = {
        type: 'scale',
        prompt: args['prompt'],
        min: args['min'] ?? 1,
        max: args['max'] ?? 10,
        step: args['step'] ?? 1,
        minLabel: args['min_label'] ?? 'Low',
        maxLabel: args['max_label'] ?? 'High',
        unit: args['unit'],
      }
    } else if (widgetType === 'calendar') {
      widgetPayload = {
        type: 'calendar',
        prompt: args['prompt'],
        minDate: args['min_date'],
        maxDate: args['max_date'],
      }
    } else if (widgetType === 'file-drop') {
      widgetPayload = {
        type: 'file-drop',
        prompt: args['prompt'],
        accept: args['accept'],
        maxFiles: args['max_files'],
      }
    }

    return {
      toolCallId: toolCall.id,
      result: 'Widget rendered successfully.',
      widgetPayload,
    }
  }

  if (name === 'mark_milestone') {
    const milestone = args['milestone'] as string
    const summary = args['summary'] as string

    const updatedMilestones = {
      ...currentMilestones,
      [milestone]: {
        status: 'complete',
        data: { ...currentMilestones[milestone]?.data, summary },
      },
    }
    const newPhase = nextPhase(currentMilestones, milestone)

    const { error } = await supabase
      .from('onboarding_states')
      .update({
        milestones: updatedMilestones,
        phase: newPhase,
        last_activity: new Date().toISOString(),
      })
      .eq('client_id', clientId)

    if (error) {
      return { toolCallId: toolCall.id, result: `Error updating milestone: ${error.message}` }
    }

    const pendingItems = MILESTONE_ORDER
      .filter((key) => updatedMilestones[key]?.status !== 'complete')
      .map((key) => key.replace(/_/g, ' '))

    // Fire-and-forget brief generation when all milestones are done
    if (newPhase === 'review') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (supabaseUrl && serviceKey) {
        fetch(`${supabaseUrl}/functions/v1/generate-brief`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ clientId }),
        }).catch(() => undefined)
      }
    }

    return {
      toolCallId: toolCall.id,
      result: `Milestone "${milestone}" marked complete. Phase is now "${newPhase}".`,
      snapshotDelta: { pendingItems, phase: newPhase, milestones: updatedMilestones },
    }
  }

  if (name === 'update_collected_data') {
    const field = args['field'] as string
    const value = args['value']

    const { error } = await supabase.rpc('merge_collected_data', {
      p_client_id: clientId,
      p_field: field,
      p_value: JSON.stringify(value),
    }).then(() => ({ error: null })).catch((e: Error) => ({ error: e }))

    // Fallback if RPC doesn't exist: direct update with JSONB merge via select+update
    if (error) {
      const { data: stateRow } = await supabase
        .from('onboarding_states')
        .select('collected_data')
        .eq('client_id', clientId)
        .single()

      const existing = (stateRow as { collected_data: Record<string, unknown> } | null)?.collected_data ?? {}
      const updated = { ...existing, [field]: value }

      const { error: updateError } = await supabase
        .from('onboarding_states')
        .update({ collected_data: updated, last_activity: new Date().toISOString() })
        .eq('client_id', clientId)

      if (updateError) {
        return { toolCallId: toolCall.id, result: `Error saving ${field}: ${updateError.message}` }
      }
    }

    // Map field to OnboardingSnapshot keys for snapshotDelta
    const snapshotFieldMap: Record<string, string> = {
      businessModel: 'businessModel',
      brandDirection: 'brandDirection',
      targetAudience: 'targetAudience',
      requiredIntegrations: 'requiredIntegrations',
    }
    const snapshotKey = snapshotFieldMap[field]
    const snapshotDelta = snapshotKey ? { [snapshotKey]: value } : undefined

    return {
      toolCallId: toolCall.id,
      result: `Saved ${field}.`,
      snapshotDelta: snapshotDelta as Record<string, unknown> | undefined,
    }
  }

  return { toolCallId: toolCall.id, result: `Unknown tool: ${name}` }
}
