-- Phase 4 fix: add missing widget_payload column to messages table
-- This column is required by the chat-agent Edge Function when tools return a widget
ALTER TABLE messages ADD COLUMN IF NOT EXISTS widget_payload JSONB;
