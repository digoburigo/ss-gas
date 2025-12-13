-- Fix gamification issues: SQL function bug and missing RLS policies

-- Drop and recreate the function with fixed GROUP BY clause
DROP FUNCTION IF EXISTS get_user_gamification_summary(UUID);

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
      SELECT COALESCE(json_agg(achievement_data), '[]'::json)
      FROM (
        SELECT json_build_object(
          'name', a.name,
          'description', a.description,
          'points', a.points,
          'icon', a.icon,
          'earned_at', ua.earned_at
        ) as achievement_data
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = p_user_id
        ORDER BY ua.earned_at DESC
        LIMIT 5
      ) recent
    ),
    'action_counts', (
      SELECT COALESCE(
        json_object_agg(
          action_type,
          json_build_object(
            'count', count,
            'last_action_at', last_action_at
          )
        ),
        '{}'::json
      )
      FROM user_action_counts
      WHERE user_id = p_user_id
    ),
    'available_achievements', (
      SELECT COALESCE(json_agg(achievement_data), '[]'::json)
      FROM (
        SELECT json_build_object(
          'name', a.name,
          'description', a.description,
          'points', a.points,
          'icon', a.icon,
          'milestone_type', a.milestone_type,
          'milestone_count', a.milestone_count,
          'current_count', COALESCE(uac.count, 0)
        ) as achievement_data
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
      ) available
    )
  ) INTO v_result
  FROM user_scores us
  WHERE us.user_id = p_user_id;

  -- If no score record exists yet, return default structure with available achievements
  IF v_result IS NULL THEN
    SELECT json_build_object(
      'total_points', 0,
      'achievements_earned', 0,
      'recent_achievements', '[]'::json,
      'action_counts', '{}'::json,
      'available_achievements', COALESCE(json_agg(
        json_build_object(
          'name', name,
          'description', description,
          'points', points,
          'icon', icon,
          'milestone_type', milestone_type,
          'milestone_count', milestone_count,
          'current_count', 0
        )
      ), '[]'::json)
    ) INTO v_result
    FROM achievements;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing RLS policies for user_action_counts
-- The triggers need to be able to INSERT and UPDATE this table
DROP POLICY IF EXISTS "System can manage action counts" ON user_action_counts;
CREATE POLICY "System can manage action counts"
  ON user_action_counts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ensure RLS policies exist for automated systems (triggers/functions)
-- These allow the increment_action_count function (running as SECURITY DEFINER) to work
ALTER TABLE user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_action_counts ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users for the function to work
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON achievements TO authenticated;
GRANT SELECT ON user_scores TO authenticated;
GRANT SELECT ON user_achievements TO authenticated;
GRANT SELECT ON user_action_counts TO authenticated;
