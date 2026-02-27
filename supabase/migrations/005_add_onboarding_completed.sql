-- Add onboarding_completed column to users table
ALTER TABLE public.users ADD COLUMN onboarding_completed BOOLEAN DEFAULT false NOT NULL;

-- Backfill existing users who already have repos
UPDATE public.users SET onboarding_completed = true
WHERE id IN (
  SELECT DISTINCT tm.user_id FROM public.team_members tm
  JOIN public.repos r ON r.team_id = tm.team_id
);
