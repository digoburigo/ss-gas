-- Create table for checklist steps
CREATE TABLE IF NOT EXISTS onboarding_checklist_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_type TEXT NOT NULL CHECK (employee_type IN ('seller', 'stock_manager')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for tracking user progress
CREATE TABLE IF NOT EXISTS onboarding_checklist_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  step_id UUID NOT NULL REFERENCES onboarding_checklist_steps(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, step_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_checklist_steps_employee_type ON onboarding_checklist_steps(employee_type, order_index);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_session ON onboarding_checklist_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_step ON onboarding_checklist_progress(step_id);

-- Enable RLS
ALTER TABLE onboarding_checklist_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_checklist_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read checklist steps" ON onboarding_checklist_steps FOR SELECT USING (true);
CREATE POLICY "Users can read their own progress" ON onboarding_checklist_progress FOR SELECT USING (true);
CREATE POLICY "Users can insert their own progress" ON onboarding_checklist_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own progress" ON onboarding_checklist_progress FOR UPDATE USING (true);

-- Insert default checklist steps for Vendedor (Seller)
INSERT INTO onboarding_checklist_steps (employee_type, title, description, order_index) VALUES
('seller', 'Criar conta no sistema de vendas', 'Acesse o portal de vendas e crie sua conta usando seu e-mail corporativo. Você receberá um link de ativação.', 1),
('seller', 'Revisar catálogo de produtos', 'Familiarize-se com nossa linha completa de tintas, vernizes e produtos relacionados. Acesse o catálogo digital.', 2),
('seller', 'Assistir treinamento de vendas', 'Complete o módulo de treinamento de técnicas de vendas e atendimento ao cliente (duração: 2 horas).', 3),
('seller', 'Conhecer políticas de preços', 'Leia e compreenda nossa política de preços, descontos e condições de pagamento.', 4),
('seller', 'Configurar metas de vendas', 'Defina suas metas mensais de vendas em conjunto com seu gerente.', 5),
('seller', 'Realizar primeira venda supervisionada', 'Complete sua primeira venda com supervisão de um vendedor experiente.', 6);

-- Insert default checklist steps for Gerente de Estoque (Stock Manager)
INSERT INTO onboarding_checklist_steps (employee_type, title, description, order_index) VALUES
('stock_manager', 'Configurar ferramentas de gestão de estoque', 'Instale e configure o sistema de gestão de estoque. Solicite credenciais ao TI.', 1),
('stock_manager', 'Revisar políticas de estoque', 'Leia o manual de políticas de controle de estoque, incluindo níveis mínimos e máximos.', 2),
('stock_manager', 'Completar treinamento de segurança', 'Participe do treinamento obrigatório de segurança no armazém (duração: 3 horas).', 3),
('stock_manager', 'Conhecer sistema de inventário', 'Aprenda a usar o sistema de inventário e realizar contagens cíclicas.', 4),
('stock_manager', 'Mapear layout do armazém', 'Faça um tour completo pelo armazém e memorize a localização dos principais produtos.', 5),
('stock_manager', 'Realizar primeiro inventário', 'Execute sua primeira contagem de inventário com supervisão.', 6);
