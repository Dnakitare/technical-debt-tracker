-- =============================================================================
-- Fix RLS performance issues and security advisory
-- 1. Recreate get_user_team_ids with SET search_path = public
-- 2. Wrap auth.uid() in (select auth.uid()) for all RLS policies
-- 3. Add missing index on users.current_team_id
-- =============================================================================

-- 1. Recreate function with fixed search_path and wrapped auth.uid()
CREATE OR REPLACE FUNCTION public.get_user_team_ids()
RETURNS SETOF UUID AS $$
  SELECT team_id FROM public.team_members WHERE user_id = (select auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Drop and recreate all affected RLS policies with (select auth.uid())

-- users policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING ((select auth.uid()) = id);

-- teams policies
DROP POLICY IF EXISTS "Team members can view team" ON public.teams;
CREATE POLICY "Team members can view team"
  ON public.teams FOR SELECT
  USING (id IN (SELECT public.get_user_team_ids()));

DROP POLICY IF EXISTS "Team owners can update team" ON public.teams;
CREATE POLICY "Team owners can update team"
  ON public.teams FOR UPDATE
  USING (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Team owners can delete team" ON public.teams;
CREATE POLICY "Team owners can delete team"
  ON public.teams FOR DELETE
  USING (owner_id = (select auth.uid()));

-- team_members policies
DROP POLICY IF EXISTS "Team members can view members" ON public.team_members;
CREATE POLICY "Team members can view members"
  ON public.team_members FOR SELECT
  USING (team_id IN (SELECT public.get_user_team_ids()));

DROP POLICY IF EXISTS "Team admins can manage members" ON public.team_members;
CREATE POLICY "Team admins can manage members"
  ON public.team_members FOR INSERT
  WITH CHECK (team_id IN (
    SELECT team_id FROM public.team_members
    WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
  ));

DROP POLICY IF EXISTS "Team admins can remove members" ON public.team_members;
CREATE POLICY "Team admins can remove members"
  ON public.team_members FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
    )
    OR user_id = (select auth.uid())
  );

-- repos policies
DROP POLICY IF EXISTS "Team members can view repos" ON public.repos;
CREATE POLICY "Team members can view repos"
  ON public.repos FOR SELECT
  USING (team_id IN (SELECT public.get_user_team_ids()));

DROP POLICY IF EXISTS "Team members can add repos" ON public.repos;
CREATE POLICY "Team members can add repos"
  ON public.repos FOR INSERT
  WITH CHECK (team_id IN (SELECT public.get_user_team_ids()));

DROP POLICY IF EXISTS "Team admins can update repos" ON public.repos;
CREATE POLICY "Team admins can update repos"
  ON public.repos FOR UPDATE
  USING (team_id IN (
    SELECT team_id FROM public.team_members
    WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
  ));

DROP POLICY IF EXISTS "Team admins can delete repos" ON public.repos;
CREATE POLICY "Team admins can delete repos"
  ON public.repos FOR DELETE
  USING (team_id IN (
    SELECT team_id FROM public.team_members
    WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
  ));

-- debt_metrics policy
DROP POLICY IF EXISTS "Team members can view debt metrics" ON public.debt_metrics;
CREATE POLICY "Team members can view debt metrics"
  ON public.debt_metrics FOR SELECT
  USING (repo_id IN (
    SELECT r.id FROM public.repos r
    WHERE r.team_id IN (SELECT public.get_user_team_ids())
  ));

-- 3. Add missing index
CREATE INDEX IF NOT EXISTS idx_users_current_team_id ON public.users(current_team_id);
