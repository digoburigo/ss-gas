-- Migration to fix foreign key constraints to reference auth.users instead of chat_users
-- This is necessary because we're using Supabase Auth, not a custom chat_users table

-- Drop existing foreign key constraints
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

-- Add new foreign key constraints referencing auth.users
-- Note: We use ON DELETE CASCADE to automatically clean up data when a user is deleted

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

-- Update RLS policies to use auth.uid() instead of checking against chat_users
-- These policies ensure users can only access their own data

-- onboarding_chat_sessions policies
DROP POLICY IF EXISTS "onboarding_chat_sessions_select_all" ON onboarding_chat_sessions;
DROP POLICY IF EXISTS "onboarding_chat_sessions_insert_all" ON onboarding_chat_sessions;
DROP POLICY IF EXISTS "onboarding_chat_sessions_update_all" ON onboarding_chat_sessions;
DROP POLICY IF EXISTS "onboarding_chat_sessions_delete_all" ON onboarding_chat_sessions;

CREATE POLICY "Users can view their own sessions" 
  ON onboarding_chat_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
  ON onboarding_chat_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
  ON onboarding_chat_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
  ON onboarding_chat_sessions FOR DELETE 
  USING (auth.uid() = user_id);
