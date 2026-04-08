import { watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { ThreadMessage } from '@/contracts/api'
import { mapMessageRow } from '@/adapters/mappers'

export function useMessageRealtime(
  clientId: Ref<string | null>,
  onInsert: (message: ThreadMessage) => void,
): void {
  let channel: RealtimeChannel | null = null

  function subscribe(id: string): void {
    channel = supabase
      .channel(`messages-realtime-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${id}` },
        (payload) => {
          onInsert(mapMessageRow(payload.new as Record<string, unknown>))
        },
      )
      .subscribe()
  }

  function cleanup(): void {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  watch(
    clientId,
    (newId) => {
      cleanup()
      if (newId) subscribe(newId)
    },
    { immediate: true },
  )

  onUnmounted(cleanup)
}
