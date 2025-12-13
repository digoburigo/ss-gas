-- Remove foreign key constraints that reference chat_users table
-- This allows the app to work with Supabase Auth (auth.users) without requiring chat_users table

-- Drop foreign key constraints from all chat tables
ALTER TABLE IF EXISTS onboarding_chat_sessions 
  DROP CONSTRAINT IF EXISTS onboarding_chat_sessions_user_id_fkey;

ALTER TABLE IF EXISTS group_chat_messages 
  DROP CONSTRAINT IF EXISTS group_chat_messages_user_id_fkey;

ALTER TABLE IF EXISTS onboarding_chats 
  DROP CONSTRAINT IF EXISTS onboarding_chats_user_id_fkey;

ALTER TABLE IF EXISTS knowledge_chats 
  DROP CONSTRAINT IF EXISTS knowledge_chats_user_id_fkey;

ALTER TABLE IF EXISTS onboarding_chat_messages 
  DROP CONSTRAINT IF EXISTS onboarding_chat_messages_session_id_fkey;

-- Add comments explaining the change
COMMENT ON TABLE onboarding_chat_sessions IS 'Chat sessions for onboarding. Uses auth.users for user_id (no FK constraint to allow flexibility)';
COMMENT ON TABLE group_chat_messages IS 'Group chat messages. Uses auth.users for user_id (no FK constraint to allow flexibility)';
COMMENT ON TABLE onboarding_chats IS 'Onboarding chat history. Uses auth.users for user_id (no FK constraint to allow flexibility)';
COMMENT ON TABLE knowledge_chats IS 'Knowledge base chat history. Uses auth.users for user_id (no FK constraint to allow flexibility)';
