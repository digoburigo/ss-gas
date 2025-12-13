-- Fix RLS policies for gamification tables to allow triggers to work

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view their own scores" ON user_scores;
DROP POLICY IF EXISTS "Users can view their own action counts" ON user_action_counts;
DROP POLICY IF EXISTS "System can manage action counts (ALL)" ON user_action_counts;

-- Create new comprehensive policies for user_scores
CREATE POLICY "Users can view their own scores"
  ON user_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage user scores"
  ON user_scores FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create new comprehensive policies for user_achievements  
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can award achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (true);

-- Create new comprehensive policies for user_action_counts
CREATE POLICY "Users can view their own action counts"
  ON user_action_counts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage action counts"
  ON user_action_counts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Make the increment_action_count function run with elevated privileges
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION increment_action_count(UUID, TEXT) TO authenticated;

COMMENT ON POLICY "System can manage user scores" ON user_scores IS 
  'Allows triggers and system functions to manage user scores';
COMMENT ON POLICY "System can award achievements" ON user_achievements IS 
  'Allows triggers and system functions to award achievements to users';
COMMENT ON POLICY "System can manage action counts" ON user_action_counts IS 
  'Allows triggers and system functions to track user actions';
