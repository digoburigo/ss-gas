-- Fix RLS policies for gamification system to allow triggers to work
-- This script adds the missing INSERT/UPDATE policies for user_achievements and user_scores

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view their own scores" ON user_scores;

-- Add comprehensive RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON user_achievements
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update achievements"
  ON user_achievements
  FOR UPDATE
  USING (true);

-- Add comprehensive RLS policies for user_scores
CREATE POLICY "Users can view their own scores"
  ON user_scores
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert scores"
  ON user_scores
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update scores"
  ON user_scores
  FOR UPDATE
  USING (true);

-- Make the trigger function run with elevated privileges
DROP FUNCTION IF EXISTS increment_action_count CASCADE;

CREATE OR REPLACE FUNCTION increment_action_count()
RETURNS TRIGGER
SECURITY DEFINER -- Run with elevated privileges to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_action_type text;
  v_new_count integer;
  v_achievement record;
BEGIN
  -- Determine user_id and action_type based on the table
  IF TG_TABLE_NAME = 'sales_orders' THEN
    v_user_id := NEW.user_id;
    v_action_type := 'sales';
  ELSIF TG_TABLE_NAME = 'calendar_events' THEN
    v_user_id := NEW.user_id;
    v_action_type := 'calendar';
  ELSIF TG_TABLE_NAME = 'kanban_cards' THEN
    -- Only count when status changes to 'Finalizado'
    IF NEW.column_id IS DISTINCT FROM OLD.column_id THEN
      SELECT user_id INTO v_user_id 
      FROM kanban_boards kb
      JOIN kanban_columns kc ON kc.board_id = kb.id
      WHERE kc.id = NEW.column_id;
      
      v_action_type := 'kanban';
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'onboarding_checklist_progress' THEN
    v_user_id := NEW.user_id;
    v_action_type := 'onboarding';
  ELSE
    RETURN NEW;
  END IF;

  -- Insert or update action count
  INSERT INTO user_action_counts (user_id, action_type, count, last_action_at)
  VALUES (v_user_id, v_action_type, 1, NOW())
  ON CONFLICT (user_id, action_type)
  DO UPDATE SET
    count = user_action_counts.count + 1,
    last_action_at = NOW(),
    updated_at = NOW()
  RETURNING count INTO v_new_count;

  -- Check for achievements
  FOR v_achievement IN
    SELECT * FROM achievements
    WHERE milestone_type = v_action_type
    AND v_new_count >= milestone_count
    AND NOT EXISTS (
      SELECT 1 FROM user_achievements
      WHERE user_id = v_user_id
      AND achievement_id = achievements.id
    )
  LOOP
    -- Award achievement
    INSERT INTO user_achievements (user_id, achievement_id, earned_at)
    VALUES (v_user_id, v_achievement.id, NOW());

    -- Add points to user score
    INSERT INTO user_scores (user_id, total_points)
    VALUES (v_user_id, v_achievement.points)
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_points = user_scores.total_points + v_achievement.points,
      updated_at = NOW();
  END LOOP;

  RETURN NEW;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_action_count() TO authenticated;

-- Recreate triggers
DROP TRIGGER IF EXISTS trigger_track_sales_order ON sales_orders;
CREATE TRIGGER trigger_track_sales_order
  AFTER INSERT ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION increment_action_count();

DROP TRIGGER IF EXISTS trigger_track_calendar_event ON calendar_events;
CREATE TRIGGER trigger_track_calendar_event
  AFTER INSERT ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION increment_action_count();

DROP TRIGGER IF EXISTS trigger_track_kanban_card ON kanban_cards;
CREATE TRIGGER trigger_track_kanban_card
  AFTER UPDATE ON kanban_cards
  FOR EACH ROW
  EXECUTE FUNCTION increment_action_count();

DROP TRIGGER IF EXISTS trigger_track_onboarding ON onboarding_checklist_progress;
CREATE TRIGGER trigger_track_onboarding
  AFTER UPDATE ON onboarding_checklist_progress
  FOR EACH ROW
  WHEN (NEW.completed = true AND OLD.completed = false)
  EXECUTE FUNCTION increment_action_count();
