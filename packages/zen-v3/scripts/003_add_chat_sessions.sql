-- Adicionar suporte para múltiplas sessões de chat

-- Tabela para armazenar sessões de chat de onboarding
create table if not exists public.onboarding_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.chat_users(id) on delete cascade,
  session_id text not null,
  employee_type text not null check (employee_type in ('vendedor', 'gerente_estoque')),
  title text default 'Nova Conversa',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Adicionar chat_session_id às mensagens de onboarding
alter table public.onboarding_chats 
  add column if not exists chat_session_id uuid references public.onboarding_chat_sessions(id) on delete cascade;

-- Habilitar RLS
alter table public.onboarding_chat_sessions enable row level security;

-- Políticas
create policy "onboarding_chat_sessions_select_all"
  on public.onboarding_chat_sessions for select
  using (true);

create policy "onboarding_chat_sessions_insert_all"
  on public.onboarding_chat_sessions for insert
  with check (true);

create policy "onboarding_chat_sessions_update_all"
  on public.onboarding_chat_sessions for update
  using (true);

create policy "onboarding_chat_sessions_delete_all"
  on public.onboarding_chat_sessions for delete
  using (true);

-- Índices
create index if not exists idx_onboarding_chat_sessions_session_id 
  on public.onboarding_chat_sessions(session_id);

create index if not exists idx_onboarding_chat_sessions_user_id 
  on public.onboarding_chat_sessions(user_id);

create index if not exists idx_onboarding_chats_chat_session_id 
  on public.onboarding_chats(chat_session_id);

-- Função para atualizar updated_at automaticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger para atualizar updated_at
create trigger update_onboarding_chat_sessions_updated_at
  before update on public.onboarding_chat_sessions
  for each row
  execute function update_updated_at_column();
