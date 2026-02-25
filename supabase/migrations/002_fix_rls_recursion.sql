-- =============================================================================
-- Fix infinite recursion in team_members RLS policies
-- The SELECT policy on team_members references team_members itself,
-- causing infinite recursion when any other policy queries team_members.
-- Solution: use a SECURITY DEFINER function that bypasses RLS.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_team_ids()
RETURNS SETOF UUID AS $$
  SELECT team_id FROM public.team_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop all policies that reference team_members in subqueries
DROP POLICY IF EXISTS "Team members can view team" ON public.teams;
DROP POLICY IF EXISTS "Team members can view members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can manage members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can remove members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view repos" ON public.repos;
DROP POLICY IF EXISTS "Team members can add repos" ON public.repos;
DROP POLICY IF EXISTS "Team admins can update repos" ON public.repos;
DROP POLICY IF EXISTS "Team admins can delete repos" ON public.repos;
DROP POLICY IF EXISTS "Team members can view debt metrics" ON public.debt_metrics;

-- Recreate policies using the helper function

CREATE POLICY "Team members can view team"
  ON public.teams FOR SELECT
  USING (id IN (SELECT public.get_user_team_ids()));

CREATE POLICY "Team members can view members"
  ON public.team_members FOR SELECT
  USING (team_id IN (SELECT public.get_user_team_ids()));

CREATE POLICY "Team admins can manage members"
  ON public.team_members FOR INSERT
  WITH CHECK (team_id IN (
    SELECT team_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Team admins can remove members"
  ON public.team_members FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Team members can view repos"
  ON public.repos FOR SELECT
  USING (team_id IN (SELECT public.get_user_team_ids()));

CREATE POLICY "Team members can add repos"
  ON public.repos FOR INSERT
  WITH CHECK (team_id IN (SELECT public.get_user_team_ids()));

CREATE POLICY "Team admins can update repos"
  ON public.repos FOR UPDATE
  USING (team_id IN (
    SELECT team_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Team admins can delete repos"
  ON public.repos FOR DELETE
  USING (team_id IN (
    SELECT team_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Team members can view debt metrics"
  ON public.debt_metrics FOR SELECT
  USING (repo_id IN (
    SELECT r.id FROM public.repos r
    WHERE r.team_id IN (SELECT public.get_user_team_ids())
  ));
