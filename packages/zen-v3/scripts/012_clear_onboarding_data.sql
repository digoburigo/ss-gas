-- Clear all onboarding chat data to start fresh
-- Run this script if you want to reset all onboarding chat data

-- Clear onboarding chat messages
DELETE FROM onboarding_chat_messages;

-- Clear onboarding chat sessions
DELETE FROM onboarding_chat_sessions;

-- Clear onboarding chats
DELETE FROM onboarding_chats;

-- Reset sequences if needed
-- (Sequences will auto-increment from the next available number)

-- Verify data is cleared
SELECT 'onboarding_chat_messages' as table_name, COUNT(*) as row_count FROM onboarding_chat_messages
UNION ALL
SELECT 'onboarding_chat_sessions', COUNT(*) FROM onboarding_chat_sessions
UNION ALL
SELECT 'onboarding_chats', COUNT(*) FROM onboarding_chats;
