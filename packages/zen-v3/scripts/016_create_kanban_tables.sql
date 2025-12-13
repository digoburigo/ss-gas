-- Create table for kanban boards
CREATE TABLE IF NOT EXISTS kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for kanban columns
CREATE TABLE IF NOT EXISTS kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for kanban cards
CREATE TABLE IF NOT EXISTS kanban_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kanban_boards_user_id ON kanban_boards(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_board_id ON kanban_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_position ON kanban_columns(board_id, position);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_column_id ON kanban_cards(column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_position ON kanban_cards(column_id, position);

-- Enable RLS
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boards
CREATE POLICY "Users can view their own boards"
  ON kanban_boards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boards"
  ON kanban_boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards"
  ON kanban_boards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards"
  ON kanban_boards FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for columns (access through board ownership)
CREATE POLICY "Users can view columns of their boards"
  ON kanban_columns FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM kanban_boards
    WHERE kanban_boards.id = kanban_columns.board_id
    AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can create columns in their boards"
  ON kanban_columns FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM kanban_boards
    WHERE kanban_boards.id = kanban_columns.board_id
    AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can update columns in their boards"
  ON kanban_columns FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM kanban_boards
    WHERE kanban_boards.id = kanban_columns.board_id
    AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete columns in their boards"
  ON kanban_columns FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM kanban_boards
    WHERE kanban_boards.id = kanban_columns.board_id
    AND kanban_boards.user_id = auth.uid()
  ));

-- RLS Policies for cards (access through column/board ownership)
CREATE POLICY "Users can view cards in their boards"
  ON kanban_cards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM kanban_columns
    JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id
    WHERE kanban_columns.id = kanban_cards.column_id
    AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can create cards in their boards"
  ON kanban_cards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM kanban_columns
    JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id
    WHERE kanban_columns.id = kanban_cards.column_id
    AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can update cards in their boards"
  ON kanban_cards FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM kanban_columns
    JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id
    WHERE kanban_columns.id = kanban_cards.column_id
    AND kanban_boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete cards in their boards"
  ON kanban_cards FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM kanban_columns
    JOIN kanban_boards ON kanban_boards.id = kanban_columns.board_id
    WHERE kanban_columns.id = kanban_cards.column_id
    AND kanban_boards.user_id = auth.uid()
  ));

-- Function to update updated_at timestamp for boards
CREATE OR REPLACE FUNCTION update_kanban_boards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp for cards
CREATE OR REPLACE FUNCTION update_kanban_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER kanban_boards_updated_at
  BEFORE UPDATE ON kanban_boards
  FOR EACH ROW
  EXECUTE FUNCTION update_kanban_boards_updated_at();

CREATE TRIGGER kanban_cards_updated_at
  BEFORE UPDATE ON kanban_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_kanban_cards_updated_at();

-- Added function to create default board with three columns for new users
CREATE OR REPLACE FUNCTION create_default_kanban_board(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_board_id UUID;
  v_column_id_1 UUID;
  v_column_id_2 UUID;
  v_column_id_3 UUID;
BEGIN
  -- Create default board
  INSERT INTO kanban_boards (user_id, title, description)
  VALUES (p_user_id, 'Meu Quadro Kanban', 'Quadro padrão para gerenciar tarefas')
  RETURNING id INTO v_board_id;

  -- Create three default columns: A fazer, Fazendo, Finalizado
  INSERT INTO kanban_columns (board_id, title, position)
  VALUES 
    (v_board_id, 'A fazer', 0),
    (v_board_id, 'Fazendo', 1),
    (v_board_id, 'Finalizado', 2);

  RETURN v_board_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
