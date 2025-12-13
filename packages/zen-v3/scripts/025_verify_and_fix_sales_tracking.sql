-- Verify and fix sales tracking for gamification

-- First, verify the trigger exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_track_sales_order'
    ) THEN
        RAISE NOTICE 'Trigger trigger_track_sales_order does not exist. Creating it now...';
        
        CREATE TRIGGER trigger_track_sales_order
          AFTER INSERT ON sales_orders
          FOR EACH ROW
          EXECUTE FUNCTION track_sales_order_creation();
    ELSE
        RAISE NOTICE 'Trigger trigger_track_sales_order already exists.';
    END IF;
END $$;

-- Verify the function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'track_sales_order_creation'
    ) THEN
        RAISE NOTICE 'Function track_sales_order_creation does not exist. This is a problem!';
    ELSE
        RAISE NOTICE 'Function track_sales_order_creation exists.';
    END IF;
END $$;

-- Add debug logging to the sales tracking
CREATE OR REPLACE FUNCTION track_sales_order_creation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE '[GAMIFICATION] Sales order created for user: %', NEW.user_id;
  PERFORM increment_action_count(NEW.user_id, 'sales');
  RAISE NOTICE '[GAMIFICATION] increment_action_count called for sales';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Test: Manually backfill any existing sales orders that weren't tracked
-- This will count all existing sales orders for users and update their action counts
INSERT INTO user_action_counts (user_id, action_type, count, last_action_at, updated_at)
SELECT 
  user_id,
  'sales' as action_type,
  COUNT(*) as count,
  MAX(created_at) as last_action_at,
  NOW() as updated_at
FROM sales_orders
GROUP BY user_id
ON CONFLICT (user_id, action_type) 
DO UPDATE SET 
  count = EXCLUDED.count,
  last_action_at = EXCLUDED.last_action_at,
  updated_at = NOW();

-- Check for milestone achievements that should have been awarded
DO $$
DECLARE
  v_user_id UUID;
  v_sales_count INTEGER;
  v_achievement_id UUID;
  v_achievement_points INTEGER;
BEGIN
  -- For each user with action counts
  FOR v_user_id, v_sales_count IN
    SELECT user_id, count 
    FROM user_action_counts 
    WHERE action_type = 'sales'
  LOOP
    -- Check if they've hit a milestone
    FOR v_achievement_id, v_achievement_points IN
      SELECT a.id, a.points
      FROM achievements a
      WHERE a.milestone_type = 'sales'
      AND a.milestone_count <= v_sales_count
      AND NOT EXISTS (
        SELECT 1 FROM user_achievements ua
        WHERE ua.user_id = v_user_id AND ua.achievement_id = a.id
      )
    LOOP
      -- Award the achievement
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (v_user_id, v_achievement_id)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;

      -- Update score
      INSERT INTO user_scores (user_id, total_points, updated_at)
      VALUES (v_user_id, v_achievement_points, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET 
        total_points = user_scores.total_points + v_achievement_points,
        updated_at = NOW();
      
      RAISE NOTICE '[GAMIFICATION] Awarded achievement % to user % for % sales', v_achievement_id, v_user_id, v_sales_count;
    END LOOP;
  END LOOP;
END $$;

-- Verify the data
SELECT 
  u.email,
  uac.action_type,
  uac.count,
  us.total_points,
  COUNT(ua.id) as achievements_earned
FROM auth.users u
LEFT JOIN user_action_counts uac ON u.id = uac.user_id
LEFT JOIN user_scores us ON u.id = us.user_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
GROUP BY u.email, uac.action_type, uac.count, us.total_points
ORDER BY u.email, uac.action_type;
