-- Drop the old unique constraint on session_id, step_id
ALTER TABLE onboarding_checklist_progress DROP CONSTRAINT IF EXISTS onboarding_checklist_progress_session_id_step_id_key;

-- Make session_id nullable since we're using user_id for auth
ALTER TABLE onboarding_checklist_progress ALTER COLUMN session_id DROP NOT NULL;

-- Add unique constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'onboarding_checklist_progress_user_id_step_id_key'
  ) THEN
    ALTER TABLE onboarding_checklist_progress 
    ADD CONSTRAINT onboarding_checklist_progress_user_id_step_id_key 
    UNIQUE (user_id, step_id);
  END IF;
END $$;

-- Update RLS policies to use user_id from auth
DROP POLICY IF EXISTS "Users can read their own progress" ON onboarding_checklist_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON onboarding_checklist_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON onboarding_checklist_progress;

CREATE POLICY "Users can read their own progress" ON onboarding_checklist_progress 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON onboarding_checklist_progress 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON onboarding_checklist_progress 
  FOR UPDATE USING (auth.uid() = user_id);
