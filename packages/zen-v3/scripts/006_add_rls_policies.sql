-- Enable RLS on all tables and add policies for authenticated users

-- Chat Users table
ALTER TABLE chat_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data" ON chat_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON chat_users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON chat_users
  FOR UPDATE USING (auth.uid() = id);

-- Onboarding Chat Sessions
ALTER TABLE onboarding_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat sessions" ON onboarding_chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions" ON onboarding_chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions" ON onboarding_chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions" ON onboarding_chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Onboarding Chats (messages)
ALTER TABLE onboarding_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON onboarding_chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages" ON onboarding_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON onboarding_chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON onboarding_chats
  FOR DELETE USING (auth.uid() = user_id);

-- Knowledge Chats
ALTER TABLE knowledge_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own knowledge chats" ON knowledge_chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own knowledge chats" ON knowledge_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge chats" ON knowledge_chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge chats" ON knowledge_chats
  FOR DELETE USING (auth.uid() = user_id);

-- Group Chat Messages
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view group chat messages
CREATE POLICY "Authenticated users can view group messages" ON group_chat_messages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only create messages with their own user_id
CREATE POLICY "Users can create their own group messages" ON group_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own messages
CREATE POLICY "Users can update their own group messages" ON group_chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own group messages" ON group_chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Onboarding Checklist Progress
ALTER TABLE onboarding_checklist_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checklist progress" ON onboarding_checklist_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checklist progress" ON onboarding_checklist_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklist progress" ON onboarding_checklist_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist progress" ON onboarding_checklist_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Onboarding Checklist Steps (read-only for all authenticated users)
ALTER TABLE onboarding_checklist_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view checklist steps" ON onboarding_checklist_steps
  FOR SELECT USING (auth.role() = 'authenticated');

-- Onboarding Documents (read-only for all authenticated users)
ALTER TABLE onboarding_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view onboarding documents" ON onboarding_documents
  FOR SELECT USING (auth.role() = 'authenticated');

-- Onboarding Processes (read-only for all authenticated users)
ALTER TABLE onboarding_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view onboarding processes" ON onboarding_processes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Chat Conversations
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" ON chat_conversations
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own conversations" ON chat_conversations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own conversations" ON chat_conversations
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own conversations" ON chat_conversations
  FOR DELETE USING (auth.uid()::text = user_id);

-- Chat Messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their conversations" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create messages in their conversations" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update messages in their conversations" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete messages in their conversations" ON chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()::text
    )
  );
