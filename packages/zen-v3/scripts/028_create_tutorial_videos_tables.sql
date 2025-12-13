-- Create tutorial videos system with sectors, sections, and steps

-- Tutorial Sectors (top level categories like "Vendedor", "Gerente de Estoque")
CREATE TABLE IF NOT EXISTS public.tutorial_sectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tutorial Sections (groups of steps within a sector)
CREATE TABLE IF NOT EXISTS public.tutorial_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_id UUID REFERENCES public.tutorial_sectors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tutorial Steps (individual video lessons)
CREATE TABLE IF NOT EXISTS public.tutorial_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES public.tutorial_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  youtube_video_url TEXT NOT NULL,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS public.tutorial_step_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.tutorial_steps(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, step_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tutorial_sectors_order ON public.tutorial_sectors(order_index);
CREATE INDEX IF NOT EXISTS idx_tutorial_sections_sector ON public.tutorial_sections(sector_id, order_index);
CREATE INDEX IF NOT EXISTS idx_tutorial_steps_section ON public.tutorial_steps(section_id, order_index);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_user ON public.tutorial_step_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_step ON public.tutorial_step_progress(step_id);

-- RLS Policies
ALTER TABLE public.tutorial_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_step_progress ENABLE ROW LEVEL SECURITY;

-- Anyone can view active tutorials
CREATE POLICY "Anyone can view active sectors"
  ON public.tutorial_sectors FOR SELECT
  USING (active = true);

CREATE POLICY "Anyone can view active sections"
  ON public.tutorial_sections FOR SELECT
  USING (active = true);

CREATE POLICY "Anyone can view active steps"
  ON public.tutorial_steps FOR SELECT
  USING (active = true);

-- Admins can manage everything (for now, authenticated users can manage)
CREATE POLICY "Authenticated users can manage sectors"
  ON public.tutorial_sectors FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage sections"
  ON public.tutorial_sections FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage steps"
  ON public.tutorial_steps FOR ALL
  USING (auth.role() = 'authenticated');

-- Users can view and manage their own progress
CREATE POLICY "Users can view their own progress"
  ON public.tutorial_step_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.tutorial_step_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.tutorial_step_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_tutorial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tutorial_sectors_updated_at
  BEFORE UPDATE ON public.tutorial_sectors
  FOR EACH ROW
  EXECUTE FUNCTION update_tutorial_updated_at();

CREATE TRIGGER update_tutorial_sections_updated_at
  BEFORE UPDATE ON public.tutorial_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_tutorial_updated_at();

CREATE TRIGGER update_tutorial_steps_updated_at
  BEFORE UPDATE ON public.tutorial_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_tutorial_updated_at();

CREATE TRIGGER update_tutorial_progress_updated_at
  BEFORE UPDATE ON public.tutorial_step_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_tutorial_updated_at();

-- Insert initial data: 2 sectors with 1 section and 1 step each

-- Sector 1: Vendedor
INSERT INTO public.tutorial_sectors (name, description, icon, order_index)
VALUES ('Vendedor', 'Treinamento completo para vendedores', '💼', 1);

-- Get the sector ID
DO $$
DECLARE
  vendedor_sector_id UUID;
  vendedor_section_id UUID;
  gerente_sector_id UUID;
  gerente_section_id UUID;
BEGIN
  -- Get Vendedor sector ID
  SELECT id INTO vendedor_sector_id FROM public.tutorial_sectors WHERE name = 'Vendedor';
  
  -- Create section for Vendedor
  INSERT INTO public.tutorial_sections (sector_id, name, description, order_index)
  VALUES (vendedor_sector_id, 'Introdução às Vendas', 'Aprenda os conceitos básicos de vendas', 1)
  RETURNING id INTO vendedor_section_id;
  
  -- Create step for Vendedor
  INSERT INTO public.tutorial_steps (section_id, title, description, youtube_video_url, duration_minutes, order_index)
  VALUES (
    vendedor_section_id,
    'Como Realizar Vendas Eficientes',
    'Aprenda técnicas fundamentais de vendas e como utilizar o sistema para processar pedidos',
    'https://www.youtube.com/watch?v=CvqE6vATDwA',
    10,
    1
  );

  -- Sector 2: Gerente de Estoque
  INSERT INTO public.tutorial_sectors (name, description, icon, order_index)
  VALUES ('Gerente de Estoque', 'Treinamento para gestão de estoque', '📦', 2)
  RETURNING id INTO gerente_sector_id;
  
  -- Create section for Gerente de Estoque
  INSERT INTO public.tutorial_sections (sector_id, name, description, order_index)
  VALUES (gerente_sector_id, 'Gestão de Inventário', 'Aprenda a gerenciar o estoque de produtos', 1)
  RETURNING id INTO gerente_section_id;
  
  -- Create step for Gerente de Estoque
  INSERT INTO public.tutorial_steps (section_id, title, description, youtube_video_url, duration_minutes, order_index)
  VALUES (
    gerente_section_id,
    'Controle de Estoque e Organização',
    'Entenda como manter o controle eficiente do estoque e organizar produtos',
    'https://www.youtube.com/watch?v=61uIqDtgits',
    15,
    1
  );
END $$;
