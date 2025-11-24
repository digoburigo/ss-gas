-- Create knowledge_chat_conversations table
CREATE TABLE IF NOT EXISTS public.knowledge_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nova Conversa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_knowledge_conversations_user_id ON public.knowledge_chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_conversations_updated_at ON public.knowledge_chat_conversations(updated_at DESC);

-- Enable RLS
ALTER TABLE public.knowledge_chat_conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.knowledge_chat_conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.knowledge_chat_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.knowledge_chat_conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.knowledge_chat_conversations;

-- Create RLS policies
CREATE POLICY "Users can view their own conversations"
  ON public.knowledge_chat_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.knowledge_chat_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.knowledge_chat_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON public.knowledge_chat_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_knowledge_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_knowledge_conversations_updated_at ON public.knowledge_chat_conversations;
CREATE TRIGGER trigger_knowledge_conversations_updated_at
  BEFORE UPDATE ON public.knowledge_chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_conversations_updated_at();
