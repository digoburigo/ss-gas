-- Comprehensive migration to fully transition from chat_users to auth.users
-- This script handles the complete migration in a safe, idempotent way

-- Step 1: Make session_id nullable in all tables (if not already done)
DO $$ 
BEGIN
  -- onboarding_chat_sessions
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'onboarding_chat_sessions' 
    AND column_name = 'session_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE onboarding_chat_sessions ALTER COLUMN session_id DROP NOT NULL;
  END IF;

  -- group_chat_messages
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'group_chat_messages' 
    AND column_name = 'session_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE group_chat_messages ALTER COLUMN session_id DROP NOT NULL;
  END IF;

  -- onboarding_chats
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'onboarding_chats' 
    AND column_name = 'session_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE onboarding_chats ALTER COLUMN session_id DROP NOT NULL;
  END IF;

  -- knowledge_chats
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'knowledge_chats' 
    AND column_name = 'session_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE knowledge_chats ALTER COLUMN session_id DROP NOT NULL;
  END IF;

  -- onboarding_checklist_progress
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'onboarding_checklist_progress' 
    AND column_name = 'session_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE onboarding_checklist_progress ALTER COLUMN session_id DROP NOT NULL;
  END IF;
END $$;

-- Step 2: Drop all foreign key constraints that reference chat_users
ALTER TABLE IF EXISTS onboarding_chat_sessions 
  DROP CONSTRAINT IF EXISTS onboarding_chat_sessions_user_id_fkey;

ALTER TABLE IF EXISTS group_chat_messages 
  DROP CONSTRAINT IF EXISTS group_chat_messages_user_id_fkey;

ALTER TABLE IF EXISTS onboarding_chats 
  DROP CONSTRAINT IF EXISTS onboarding_chats_user_id_fkey;

ALTER TABLE IF EXISTS knowledge_chats 
  DROP CONSTRAINT IF EXISTS knowledge_chats_user_id_fkey;

ALTER TABLE IF EXISTS onboarding_checklist_progress 
  DROP CONSTRAINT IF EXISTS onboarding_checklist_progress_user_id_fkey;

-- Step 3: Add new foreign key constraints referencing auth.users
-- These will allow NULL values and cascade on delete

ALTER TABLE onboarding_chat_sessions 
  ADD CONSTRAINT onboarding_chat_sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE group_chat_messages 
  ADD CONSTRAINT group_chat_messages_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE onboarding_chats 
  ADD CONSTRAINT onboarding_chats_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE knowledge_chats 
  ADD CONSTRAINT knowledge_chats_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE onboarding_checklist_progress 
  ADD CONSTRAINT onboarding_checklist_progress_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 4: Update RLS policies to use auth.uid()
-- Drop old policies
DROP POLICY IF EXISTS "chat_users_select_all" ON chat_users;
DROP POLICY IF EXISTS "chat_users_insert_all" ON chat_users;
DROP POLICY IF EXISTS "onboarding_chats_select_all" ON onboarding_chats;
DROP POLICY IF EXISTS "onboarding_chats_insert_all" ON onboarding_chats;
DROP POLICY IF EXISTS "knowledge_chats_select_all" ON knowledge_chats;
DROP POLICY IF EXISTS "knowledge_chats_insert_all" ON knowledge_chats;
DROP POLICY IF EXISTS "group_chat_messages_select_all" ON group_chat_messages;
DROP POLICY IF EXISTS "group_chat_messages_insert_all" ON group_chat_messages;

-- Create new auth-based policies for onboarding_chats
CREATE POLICY "Users can view their own onboarding chats" 
  ON onboarding_chats FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own onboarding chats" 
  ON onboarding_chats FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding chats" 
  ON onboarding_chats FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding chats" 
  ON onboarding_chats FOR DELETE 
  USING (auth.uid() = user_id);

-- Create new auth-based policies for knowledge_chats
CREATE POLICY "Users can view their own knowledge chats" 
  ON knowledge_chats FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own knowledge chats" 
  ON knowledge_chats FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge chats" 
  ON knowledge_chats FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge chats" 
  ON knowledge_chats FOR DELETE 
  USING (auth.uid() = user_id);

-- Create new auth-based policies for group_chat_messages
-- Group chat is shared, so everyone can read, but only create their own
CREATE POLICY "Everyone can view group chat messages" 
  ON group_chat_messages FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own group chat messages" 
  ON group_chat_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own group chat messages" 
  ON group_chat_messages FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own group chat messages" 
  ON group_chat_messages FOR DELETE 
  USING (auth.uid() = user_id);

-- Step 5: Deprecate chat_users table (keep it for now but mark as deprecated)
-- We don't drop it immediately in case there's data that needs to be migrated
COMMENT ON TABLE chat_users IS 'DEPRECATED: This table is no longer used. All authentication now uses auth.users from Supabase Auth.';

-- Step 6: Create indexes for better performance with auth-based queries
CREATE INDEX IF NOT EXISTS idx_onboarding_chats_user_id ON onboarding_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chats_user_id ON knowledge_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_user_id ON group_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_chat_sessions_user_id ON onboarding_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_checklist_progress_user_id ON onboarding_checklist_progress(user_id);
