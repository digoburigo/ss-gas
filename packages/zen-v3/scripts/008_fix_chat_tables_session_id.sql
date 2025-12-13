-- Migration to make session_id nullable in all chat tables
-- This allows the tables to work with the new auth-based system while maintaining backward compatibility

-- Fix group_chat_messages table
DO $$ 
BEGIN
  -- Make session_id nullable
  ALTER TABLE group_chat_messages ALTER COLUMN session_id DROP NOT NULL;
  
  -- Add message_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'group_chat_messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE group_chat_messages ADD COLUMN message_type text DEFAULT 'user';
  END IF;
  
  -- Update user_id to reference auth.users instead of chat_users
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'group_chat_messages_user_id_fkey'
  ) THEN
    ALTER TABLE group_chat_messages DROP CONSTRAINT group_chat_messages_user_id_fkey;
  END IF;
  
  -- Make user_id nullable temporarily for migration
  ALTER TABLE group_chat_messages ALTER COLUMN user_id DROP NOT NULL;
  
  RAISE NOTICE 'group_chat_messages table updated successfully';
END $$;

-- Fix onboarding_chats table
DO $$ 
BEGIN
  ALTER TABLE onboarding_chats ALTER COLUMN session_id DROP NOT NULL;
  RAISE NOTICE 'onboarding_chats table updated successfully';
END $$;

-- Fix knowledge_chats table
DO $$ 
BEGIN
  ALTER TABLE knowledge_chats ALTER COLUMN session_id DROP NOT NULL;
  RAISE NOTICE 'knowledge_chats table updated successfully';
END $$;

-- Fix onboarding_chat_sessions table
DO $$ 
BEGIN
  ALTER TABLE onboarding_chat_sessions ALTER COLUMN session_id DROP NOT NULL;
  RAISE NOTICE 'onboarding_chat_sessions table updated successfully';
END $$;

-- Update RLS policies for group_chat_messages to use auth.uid()
DROP POLICY IF EXISTS "group_chat_messages_select_all" ON group_chat_messages;
DROP POLICY IF EXISTS "group_chat_messages_insert_all" ON group_chat_messages;

CREATE POLICY "group_chat_messages_select_authenticated"
  ON group_chat_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "group_chat_messages_insert_authenticated"
  ON group_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "group_chat_messages_update_own"
  ON group_chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
