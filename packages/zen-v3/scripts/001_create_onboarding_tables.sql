-- Tabela para armazenar processos de onboarding por tipo de funcionário
create table if not exists public.onboarding_processes (
  id uuid primary key default gen_random_uuid(),
  employee_type text not null check (employee_type in ('vendedor', 'gerente_estoque')),
  title text not null,
  content text not null,
  order_index integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tabela para armazenar PDFs de onboarding
create table if not exists public.onboarding_documents (
  id uuid primary key default gen_random_uuid(),
  employee_type text not null check (employee_type in ('vendedor', 'gerente_estoque')),
  title text not null,
  file_url text not null,
  file_name text not null,
  file_size integer,
  created_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table public.onboarding_processes enable row level security;
alter table public.onboarding_documents enable row level security;

-- Políticas para permitir leitura pública (qualquer um pode ler os processos)
create policy "onboarding_processes_select_all"
  on public.onboarding_processes for select
  using (true);

create policy "onboarding_documents_select_all"
  on public.onboarding_documents for select
  using (true);

-- Políticas para permitir inserção, atualização e exclusão (sem autenticação por enquanto)
-- Em produção, você deve adicionar autenticação de admin
create policy "onboarding_processes_insert_all"
  on public.onboarding_processes for insert
  with check (true);

create policy "onboarding_processes_update_all"
  on public.onboarding_processes for update
  using (true);

create policy "onboarding_processes_delete_all"
  on public.onboarding_processes for delete
  using (true);

create policy "onboarding_documents_insert_all"
  on public.onboarding_documents for insert
  with check (true);

create policy "onboarding_documents_delete_all"
  on public.onboarding_documents for delete
  using (true);

-- Índices para melhor performance
create index if not exists idx_onboarding_processes_employee_type 
  on public.onboarding_processes(employee_type);

create index if not exists idx_onboarding_documents_employee_type 
  on public.onboarding_documents(employee_type);
