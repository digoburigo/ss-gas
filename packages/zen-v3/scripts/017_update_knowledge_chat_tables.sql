-- Drop the old knowledge_chats table and create proper structure
DROP TABLE IF EXISTS knowledge_chats CASCADE;

-- Create knowledge_chat_conversations table
CREATE TABLE IF NOT EXISTS knowledge_chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create knowledge_chat_messages table
CREATE TABLE IF NOT EXISTS knowledge_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES knowledge_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE knowledge_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_chat_conversations
CREATE POLICY "Users can view their own conversations"
  ON knowledge_chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON knowledge_chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON knowledge_chat_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON knowledge_chat_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for knowledge_chat_messages
CREATE POLICY "Users can view messages in their conversations"
  ON knowledge_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_chat_conversations
      WHERE knowledge_chat_conversations.id = knowledge_chat_messages.conversation_id
      AND knowledge_chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON knowledge_chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_chat_conversations
      WHERE knowledge_chat_conversations.id = knowledge_chat_messages.conversation_id
      AND knowledge_chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON knowledge_chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_chat_conversations
      WHERE knowledge_chat_conversations.id = knowledge_chat_messages.conversation_id
      AND knowledge_chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in their conversations"
  ON knowledge_chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_chat_conversations
      WHERE knowledge_chat_conversations.id = knowledge_chat_messages.conversation_id
      AND knowledge_chat_conversations.user_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_knowledge_chat_messages_conversation_id 
  ON knowledge_chat_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_chat_conversations_user_id 
  ON knowledge_chat_conversations(user_id);
