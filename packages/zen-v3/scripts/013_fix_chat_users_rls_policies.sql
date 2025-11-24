-- Fix RLS policies for chat_users and related tables
-- This allows authenticated users to properly access their data through the chat_users relationship

-- ============================================
-- Fix chat_users table policies
-- ============================================

-- Drop existing restrictive policies that check against id
DROP POLICY IF EXISTS "Users can view their own data" ON chat_users;
DROP POLICY IF EXISTS "Users can insert their own data" ON chat_users;
DROP POLICY IF EXISTS "Users can update their own data" ON chat_users;
DROP POLICY IF EXISTS "chat_users_select_all" ON chat_users;
DROP POLICY IF EXISTS "chat_users_insert_all" ON chat_users;

-- Create new policies that check against session_id (which contains auth.uid())
CREATE POLICY "Users can view their own chat_users data" ON chat_users
  FOR SELECT USING (auth.uid()::text = session_id);

CREATE POLICY "Users can insert their own chat_users data" ON chat_users
  FOR INSERT WITH CHECK (auth.uid()::text = session_id);

CREATE POLICY "Users can update their own chat_users data" ON chat_users
  FOR UPDATE USING (auth.uid()::text = session_id);

CREATE POLICY "Users can delete their own chat_users data" ON chat_users
  FOR DELETE USING (auth.uid()::text = session_id);

-- ============================================
-- Fix onboarding_chat_sessions policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON onboarding_chat_sessions;
DROP POLICY IF EXISTS "Users can create their own chat sessions" ON onboarding_chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON onboarding_chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON onboarding_chat_sessions;

-- Create new policies that check through the chat_users relationship
CREATE POLICY "Users can view their own chat sessions" ON onboarding_chat_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_users
      WHERE chat_users.id = onboarding_chat_sessions.user_id
      AND chat_users.session_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create their own chat sessions" ON onboarding_chat_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_users
      WHERE chat_users.id = onboarding_chat_sessions.user_id
      AND chat_users.session_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own chat sessions" ON onboarding_chat_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_users
      WHERE chat_users.id = onboarding_chat_sessions.user_id
      AND chat_users.session_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete their own chat sessions" ON onboarding_chat_sessions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_users
      WHERE chat_users.id = onboarding_chat_sessions.user_id
      AND chat_users.session_id = auth.uid()::text
    )
  );

-- ============================================
-- Fix onboarding_chats (messages) policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own messages" ON onboarding_chats;
DROP POLICY IF EXISTS "Users can create their own messages" ON onboarding_chats;
DROP POLICY IF EXISTS "Users can update their own messages" ON onboarding_chats;
DROP POLICY IF EXISTS "Users can delete their own messages" ON onboarding_chats;
DROP POLICY IF EXISTS "onboarding_chats_select_all" ON onboarding_chats;
DROP POLICY IF EXISTS "onboarding_chats_insert_all" ON onboarding_chats;

-- Create new policies that check through the chat_users relationship
CREATE POLICY "Users can view their own onboarding messages" ON onboarding_chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_users
      WHERE chat_users.id = onboarding_chats.user_id
      AND chat_users.session_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create their own onboarding messages" ON onboarding_chats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_users
      WHERE chat_users.id = onboarding_chats.user_id
      AND chat_users.session_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own onboarding messages" ON onboarding_chats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_users
      WHERE chat_users.id = onboarding_chats.user_id
      AND chat_users.session_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete their own onboarding messages" ON onboarding_chats
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_users
      WHERE chat_users.id = onboarding_chats.user_id
      AND chat_users.session_id = auth.uid()::text
    )
  );
