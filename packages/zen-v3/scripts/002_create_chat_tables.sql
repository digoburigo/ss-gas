-- Substituindo schema genérico por tabelas específicas para cada tipo de chat

-- Tabela para armazenar usuários do chat (identificados por session_id)
create table if not exists public.chat_users (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  name text,
  employee_type text check (employee_type in ('vendedor', 'gerente_estoque')),
  created_at timestamp with time zone default now()
);

-- Tabela para mensagens do chat de onboarding
create table if not exists public.onboarding_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.chat_users(id) on delete cascade,
  session_id text not null,
  employee_type text not null check (employee_type in ('vendedor', 'gerente_estoque')),
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- Tabela para mensagens do chat de conhecimento
create table if not exists public.knowledge_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.chat_users(id) on delete cascade,
  session_id text not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default now()
);

-- Tabela para mensagens do chat em grupo
create table if not exists public.group_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.chat_users(id) on delete cascade,
  session_id text not null,
  user_name text not null,
  message text not null,
  created_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table public.chat_users enable row level security;
alter table public.onboarding_chats enable row level security;
alter table public.knowledge_chats enable row level security;
alter table public.group_chat_messages enable row level security;

-- Políticas para permitir acesso público (em produção, adicionar autenticação adequada)
create policy "chat_users_select_all"
  on public.chat_users for select
  using (true);

create policy "chat_users_insert_all"
  on public.chat_users for insert
  with check (true);

create policy "onboarding_chats_select_all"
  on public.onboarding_chats for select
  using (true);

create policy "onboarding_chats_insert_all"
  on public.onboarding_chats for insert
  with check (true);

create policy "knowledge_chats_select_all"
  on public.knowledge_chats for select
  using (true);

create policy "knowledge_chats_insert_all"
  on public.knowledge_chats for insert
  with check (true);

create policy "group_chat_messages_select_all"
  on public.group_chat_messages for select
  using (true);

create policy "group_chat_messages_insert_all"
  on public.group_chat_messages for insert
  with check (true);

-- Índices para melhor performance
create index if not exists idx_chat_users_session_id 
  on public.chat_users(session_id);

create index if not exists idx_onboarding_chats_session_id 
  on public.onboarding_chats(session_id);

create index if not exists idx_onboarding_chats_employee_type 
  on public.onboarding_chats(employee_type);

create index if not exists idx_knowledge_chats_session_id 
  on public.knowledge_chats(session_id);

create index if not exists idx_group_chat_messages_created_at 
  on public.group_chat_messages(created_at);
