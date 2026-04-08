import { watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { IngestStatus } from '@/contracts/api'

interface SeedRealtimePayload {
  id: string
  client_id: string
  ingest_status: IngestStatus
  error_message: string | null
}

export function useSeedRealtime(
  clientId: Ref<string | null>,
  onUpdate: (seedId: string, ingestStatus: IngestStatus, errorMessage: string | null) => void,
): { cleanup: () => void } {
  let channel: RealtimeChannel | null = null

  function subscribe(id: string): void {
    channel = supabase
      .channel(`seed-updates-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_data_seeds',
          filter: `client_id=eq.${id}`,
        },
        (payload) => {
          const record = payload.new as SeedRealtimePayload
          if (record.ingest_status !== undefined) {
            onUpdate(record.id, record.ingest_status, record.error_message ?? null)
          }
        },
      )
      .subscribe()
  }

  function cleanup(): void {
    if (channel !== null) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  watch(
    clientId,
    (newId) => {
      cleanup()
      if (newId !== null) {
        subscribe(newId)
      }
    },
    { immediate: true },
  )

  onUnmounted(cleanup)

  return { cleanup }
}
