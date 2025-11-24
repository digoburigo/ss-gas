-- Create gamification tables for tracking user scores and achievements

-- User scores table to track total points
CREATE TABLE IF NOT EXISTS user_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Achievements/milestones definition table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  points INTEGER NOT NULL,
  milestone_type TEXT NOT NULL, -- 'sales', 'events', 'kanban_tasks', 'onboarding'
  milestone_count INTEGER NOT NULL, -- e.g., 5 for "5 sales"
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements tracking (which achievements users have earned)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  UNIQUE(user_id, achievement_id) -- Each user can only earn each achievement once
);

-- Action tracking table to count user actions
CREATE TABLE IF NOT EXISTS user_action_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'sales', 'events', 'kanban_tasks', 'onboarding'
  count INTEGER NOT NULL DEFAULT 0,
  last_action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_action_counts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(user_id, action_type)
);

-- Insert default achievements
INSERT INTO achievements (name, description, points, milestone_type, milestone_count, icon) VALUES
  ('Sales Champion', 'Created 5 sales orders', 10, 'sales', 5, '💰'),
  ('Event Organizer', 'Scheduled 5 calendar events', 10, 'events', 5, '📅'),
  ('Task Master', 'Completed 5 kanban tasks', 10, 'kanban_tasks', 5, '✅'),
  ('Onboarding Complete', 'Finished the initial onboarding', 10, 'onboarding', 1, '🎓')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_scores_user_id ON user_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_action_counts_user_id ON user_action_counts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_action_counts_action_type ON user_action_counts(action_type);

-- Function to increment action count and check for milestone achievements
CREATE OR REPLACE FUNCTION increment_action_count(
  p_user_id UUID,
  p_action_type TEXT
) RETURNS VOID AS $$
DECLARE
  v_new_count INTEGER;
  v_achievement_id UUID;
  v_achievement_points INTEGER;
  v_already_earned BOOLEAN;
BEGIN
  -- Insert or update action count
  INSERT INTO user_action_counts (user_id, action_type, count, last_action_at, updated_at)
  VALUES (p_user_id, p_action_type, 1, NOW(), NOW())
  ON CONFLICT (user_id, action_type) 
  DO UPDATE SET 
    count = user_action_counts.count + 1,
    last_action_at = NOW(),
    updated_at = NOW()
  RETURNING count INTO v_new_count;

  -- Check if user has reached a milestone
  FOR v_achievement_id, v_achievement_points IN
    SELECT a.id, a.points
    FROM achievements a
    WHERE a.milestone_type = p_action_type
    AND a.milestone_count = v_new_count
  LOOP
    -- Check if user already earned this achievement
    SELECT EXISTS(
      SELECT 1 FROM user_achievements 
      WHERE user_id = p_user_id AND achievement_id = v_achievement_id
    ) INTO v_already_earned;

    -- If not earned yet, award it
    IF NOT v_already_earned THEN
      -- Insert achievement
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (p_user_id, v_achievement_id);

      -- Initialize or update user score
      INSERT INTO user_scores (user_id, total_points, updated_at)
      VALUES (p_user_id, v_achievement_points, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET 
        total_points = user_scores.total_points + v_achievement_points,
        updated_at = NOW();
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for sales_orders
CREATE OR REPLACE FUNCTION track_sales_order_creation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM increment_action_count(NEW.user_id, 'sales');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for calendar_events
CREATE OR REPLACE FUNCTION track_calendar_event_creation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM increment_action_count(NEW.user_id, 'events');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for kanban_cards when moved to "Finalizado" column
CREATE OR REPLACE FUNCTION track_kanban_task_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_column_title TEXT;
  v_board_user_id UUID;
BEGIN
  -- Only track when card is moved (updated) to a new column
  IF (TG_OP = 'UPDATE' AND OLD.column_id IS DISTINCT FROM NEW.column_id) OR TG_OP = 'INSERT' THEN
    -- Get the column title
    SELECT kc.title, kb.user_id INTO v_column_title, v_board_user_id
    FROM kanban_columns kc
    JOIN kanban_boards kb ON kc.board_id = kb.id
    WHERE kc.id = NEW.column_id;

    -- If moved to "Finalizado" column, increment the count
    IF v_column_title = 'Finalizado' THEN
      PERFORM increment_action_count(v_board_user_id, 'kanban_tasks');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for onboarding completion
CREATE OR REPLACE FUNCTION track_onboarding_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_total_steps INTEGER;
  v_completed_steps INTEGER;
BEGIN
  -- Only track when a step is newly completed
  IF NEW.completed = TRUE AND (OLD IS NULL OR OLD.completed = FALSE) THEN
    -- Count total steps for this employee type
    SELECT COUNT(*) INTO v_total_steps
    FROM onboarding_checklist_steps ocs
    WHERE ocs.employee_type = (
      SELECT ocp.session_id 
      FROM onboarding_checklist_progress ocp2
      WHERE ocp2.id = NEW.id
      LIMIT 1
    );

    -- Count completed steps for this user
    SELECT COUNT(*) INTO v_completed_steps
    FROM onboarding_checklist_progress
    WHERE user_id = NEW.user_id 
    AND session_id = NEW.session_id
    AND completed = TRUE;

    -- If all steps completed, award achievement
    IF v_completed_steps >= v_total_steps THEN
      PERFORM increment_action_count(NEW.user_id, 'onboarding');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_track_sales_order ON sales_orders;
CREATE TRIGGER trigger_track_sales_order
  AFTER INSERT ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION track_sales_order_creation();

DROP TRIGGER IF EXISTS trigger_track_calendar_event ON calendar_events;
CREATE TRIGGER trigger_track_calendar_event
  AFTER INSERT ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION track_calendar_event_creation();

DROP TRIGGER IF EXISTS trigger_track_kanban_completion ON kanban_cards;
CREATE TRIGGER trigger_track_kanban_completion
  AFTER INSERT OR UPDATE ON kanban_cards
  FOR EACH ROW
  EXECUTE FUNCTION track_kanban_task_completion();

DROP TRIGGER IF EXISTS trigger_track_onboarding_completion ON onboarding_checklist_progress;
CREATE TRIGGER trigger_track_onboarding_completion
  AFTER INSERT OR UPDATE ON onboarding_checklist_progress
  FOR EACH ROW
  EXECUTE FUNCTION track_onboarding_completion();

-- Enable RLS on all gamification tables
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_action_counts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_scores
CREATE POLICY "Users can view their own scores"
  ON user_scores FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for achievements (everyone can view)
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for user_action_counts
CREATE POLICY "Users can view their own action counts"
  ON user_action_counts FOR SELECT
  USING (auth.uid() = user_id);

-- Function to get user's gamification summary
CREATE OR REPLACE FUNCTION get_user_gamification_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_points', COALESCE(us.total_points, 0),
    'achievements_earned', (
      SELECT COUNT(*) FROM user_achievements WHERE user_id = p_user_id
    ),
    'recent_achievements', (
      SELECT json_agg(
        json_build_object(
          'name', a.name,
          'description', a.description,
          'points', a.points,
          'icon', a.icon,
          'earned_at', ua.earned_at
        )
      )
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = p_user_id
      ORDER BY ua.earned_at DESC
      LIMIT 5
    ),
    'action_counts', (
      SELECT json_object_agg(
        action_type,
        json_build_object(
          'count', count,
          'last_action_at', last_action_at
        )
      )
      FROM user_action_counts
      WHERE user_id = p_user_id
    ),
    'available_achievements', (
      SELECT json_agg(
        json_build_object(
          'name', a.name,
          'description', a.description,
          'points', a.points,
          'icon', a.icon,
          'milestone_type', a.milestone_type,
          'milestone_count', a.milestone_count,
          'current_count', COALESCE(uac.count, 0)
        )
      )
      FROM achievements a
      LEFT JOIN user_action_counts uac ON (
        uac.user_id = p_user_id 
        AND uac.action_type = a.milestone_type
      )
      WHERE NOT EXISTS (
        SELECT 1 FROM user_achievements ua
        WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
      )
      ORDER BY a.milestone_count
    )
  ) INTO v_result
  FROM user_scores us
  WHERE us.user_id = p_user_id;

  RETURN COALESCE(v_result, json_build_object(
    'total_points', 0,
    'achievements_earned', 0,
    'recent_achievements', '[]'::json,
    'action_counts', '{}'::json,
    'available_achievements', (
      SELECT json_agg(
        json_build_object(
          'name', name,
          'description', description,
          'points', points,
          'icon', icon,
          'milestone_type', milestone_type,
          'milestone_count', milestone_count,
          'current_count', 0
        )
      )
      FROM achievements
    )
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
