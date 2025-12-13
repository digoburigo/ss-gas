-- Create knowledge_chat_messages table
CREATE TABLE IF NOT EXISTS public.knowledge_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.knowledge_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_knowledge_messages_conversation_id ON public.knowledge_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_messages_created_at ON public.knowledge_chat_messages(created_at ASC);

-- Enable RLS
ALTER TABLE public.knowledge_chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.knowledge_chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.knowledge_chat_messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.knowledge_chat_messages;
DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON public.knowledge_chat_messages;

-- Create RLS policies
CREATE POLICY "Users can view messages from their conversations"
  ON public.knowledge_chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_chat_conversations
      WHERE id = knowledge_chat_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON public.knowledge_chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.knowledge_chat_conversations
      WHERE id = knowledge_chat_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON public.knowledge_chat_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_chat_conversations
      WHERE id = knowledge_chat_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in their conversations"
  ON public.knowledge_chat_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_chat_conversations
      WHERE id = knowledge_chat_messages.conversation_id
      AND user_id = auth.uid()
    )
  );
