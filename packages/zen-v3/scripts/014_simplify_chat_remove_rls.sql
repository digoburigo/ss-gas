-- Simplify chat tables by removing RLS and complex constraints
-- This makes the onboarding chat a simple CRUD system

-- Disable RLS on all chat-related tables
ALTER TABLE chat_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_chat_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chats DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies on chat_users
DROP POLICY IF EXISTS "Users can view their own data" ON chat_users;
DROP POLICY IF EXISTS "Users can insert their own data" ON chat_users;
DROP POLICY IF EXISTS "Users can update their own data" ON chat_users;
DROP POLICY IF EXISTS "Users can delete their own data" ON chat_users;

-- Drop all RLS policies on onboarding_chat_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON onboarding_chat_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON onboarding_chat_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON onboarding_chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON onboarding_chat_sessions;

-- Drop all RLS policies on onboarding_chats
DROP POLICY IF EXISTS "Users can view their own chats" ON onboarding_chats;
DROP POLICY IF EXISTS "Users can insert their own chats" ON onboarding_chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON onboarding_chats;
DROP POLICY IF EXISTS "Users can delete their own chats" ON onboarding_chats;

-- Drop all RLS policies on group_chat_messages
DROP POLICY IF EXISTS "Anyone can view group messages" ON group_chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON group_chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON group_chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON group_chat_messages;

-- Drop all RLS policies on knowledge_chats
DROP POLICY IF EXISTS "Users can view their own knowledge chats" ON knowledge_chats;
DROP POLICY IF EXISTS "Users can insert their own knowledge chats" ON knowledge_chats;
DROP POLICY IF EXISTS "Users can update their own knowledge chats" ON knowledge_chats;
DROP POLICY IF EXISTS "Users can delete their own knowledge chats" ON knowledge_chats;

-- Make user_id nullable in onboarding_chat_sessions (optional relation)
ALTER TABLE onboarding_chat_sessions ALTER COLUMN user_id DROP NOT NULL;

-- Make session_id nullable in all tables (we use user_id from auth now)
ALTER TABLE onboarding_chat_sessions ALTER COLUMN session_id DROP NOT NULL;
ALTER TABLE onboarding_chats ALTER COLUMN session_id DROP NOT NULL;
ALTER TABLE group_chat_messages ALTER COLUMN session_id DROP NOT NULL;
ALTER TABLE knowledge_chats ALTER COLUMN session_id DROP NOT NULL;

-- Drop the foreign key constraint from onboarding_chat_sessions to chat_users
-- This makes the user relation optional
ALTER TABLE onboarding_chat_sessions DROP CONSTRAINT IF EXISTS onboarding_chat_sessions_user_id_fkey;

-- Add a simple index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_onboarding_chat_sessions_user_id ON onboarding_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_chats_user_id ON onboarding_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_user_id ON group_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chats_user_id ON knowledge_chats(user_id);

-- Add user_id column to tables that don't have it yet (for direct auth.users reference)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'onboarding_chats' AND column_name = 'user_id') THEN
    ALTER TABLE onboarding_chats ADD COLUMN user_id uuid;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'knowledge_chats' AND column_name = 'user_id') THEN
    ALTER TABLE knowledge_chats ADD COLUMN user_id uuid;
  END IF;
END $$;

COMMENT ON TABLE chat_users IS 'Legacy table - no longer used with Supabase Auth';
COMMENT ON TABLE onboarding_chat_sessions IS 'Onboarding chat sessions - user_id references auth.users';
COMMENT ON TABLE onboarding_chats IS 'Onboarding chat messages - user_id references auth.users';
