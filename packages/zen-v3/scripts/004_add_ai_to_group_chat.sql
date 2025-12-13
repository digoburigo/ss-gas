-- Add support for AI messages in group chat

-- Add message_type column to distinguish between user and AI messages
alter table public.group_chat_messages 
add column if not exists message_type text not null default 'user' 
check (message_type in ('user', 'ai', 'system'));

-- Add parent_message_id to link AI responses to original questions
alter table public.group_chat_messages 
add column if not exists parent_message_id uuid references public.group_chat_messages(id) on delete set null;

-- Create index for parent_message_id lookups
create index if not exists idx_group_chat_messages_parent_id 
on public.group_chat_messages(parent_message_id);

-- Add metadata column for storing additional info (like AI model used)
alter table public.group_chat_messages 
add column if not exists metadata jsonb default '{}'::jsonb;
