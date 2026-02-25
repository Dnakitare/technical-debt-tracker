-- =============================================================================
-- Technical Debt Tracker - Initial Schema
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS (profile data extending Supabase auth.users)
-- =============================================================================
CREATE TABLE public.users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  github_username TEXT,
  github_token    TEXT,
  stripe_customer_id TEXT UNIQUE,
  current_team_id UUID,
  hourly_rate     NUMERIC(10,2) DEFAULT 100.00,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX idx_users_github_username ON public.users(github_username);

-- =============================================================================
-- TEAMS
-- =============================================================================
CREATE TABLE public.teams (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  owner_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'trialing' CHECK (
    subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid')
  ),
  subscription_period_end TIMESTAMPTZ,
  max_repos       INTEGER NOT NULL DEFAULT 1,
  max_members     INTEGER NOT NULL DEFAULT 1,
  default_hourly_rate NUMERIC(10,2) DEFAULT 100.00,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_teams_owner_id ON public.teams(owner_id);
CREATE INDEX idx_teams_slug ON public.teams(slug);

ALTER TABLE public.users
  ADD CONSTRAINT fk_users_current_team
  FOREIGN KEY (current_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- =============================================================================
-- TEAM_MEMBERS
-- =============================================================================
CREATE TABLE public.team_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id         UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_email   TEXT,
  invited_at      TIMESTAMPTZ,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);

-- =============================================================================
-- REPOS
-- =============================================================================
CREATE TABLE public.repos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id         UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  github_repo_id  BIGINT NOT NULL,
  github_owner    TEXT NOT NULL,
  github_name     TEXT NOT NULL,
  github_full_name TEXT NOT NULL,
  github_url      TEXT NOT NULL,
  default_branch  TEXT DEFAULT 'main',
  is_private      BOOLEAN DEFAULT false,
  language        TEXT,
  last_synced_at  TIMESTAMPTZ,
  sync_status     TEXT DEFAULT 'pending' CHECK (
    sync_status IN ('pending', 'syncing', 'completed', 'failed')
  ),
  sync_error      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, github_repo_id)
);

CREATE INDEX idx_repos_team_id ON public.repos(team_id);
CREATE INDEX idx_repos_github_repo_id ON public.repos(github_repo_id);
CREATE INDEX idx_repos_sync_status ON public.repos(sync_status);

-- =============================================================================
-- DEBT_METRICS
-- =============================================================================
CREATE TABLE public.debt_metrics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id         UUID NOT NULL REFERENCES public.repos(id) ON DELETE CASCADE,
  snapshot_date   DATE NOT NULL,
  total_issues          INTEGER DEFAULT 0,
  critical_issues       INTEGER DEFAULT 0,
  high_issues           INTEGER DEFAULT 0,
  medium_issues         INTEGER DEFAULT 0,
  low_issues            INTEGER DEFAULT 0,
  estimated_hours       NUMERIC(10,2) DEFAULT 0,
  estimated_cost_usd    NUMERIC(12,2) DEFAULT 0,
  avg_pr_age_days       NUMERIC(8,2),
  stale_branches        INTEGER DEFAULT 0,
  todo_count            INTEGER DEFAULT 0,
  issues_opened         INTEGER DEFAULT 0,
  issues_closed         INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(repo_id, snapshot_date)
);

CREATE INDEX idx_debt_metrics_repo_id ON public.debt_metrics(repo_id);
CREATE INDEX idx_debt_metrics_snapshot_date ON public.debt_metrics(snapshot_date);
CREATE INDEX idx_debt_metrics_repo_date ON public.debt_metrics(repo_id, snapshot_date DESC);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Team members can view team"
  ON public.teams FOR SELECT
  USING (id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Team owners can update team"
  ON public.teams FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can delete team"
  ON public.teams FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Team members can view members"
  ON public.team_members FOR SELECT
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

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
  USING (team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid()));

CREATE POLICY "Team members can add repos"
  ON public.repos FOR INSERT
  WITH CHECK (team_id IN (
    SELECT team_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
  ));

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
    JOIN public.team_members tm ON tm.team_id = r.team_id
    WHERE tm.user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert debt metrics"
  ON public.debt_metrics FOR INSERT WITH CHECK (true);

-- =============================================================================
-- FUNCTIONS / TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_users_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_teams_updated
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_repos_updated
  BEFORE UPDATE ON public.repos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user_team()
RETURNS TRIGGER AS $$
DECLARE
  new_team_id UUID;
BEGIN
  INSERT INTO public.teams (name, slug, owner_id, plan)
  VALUES (
    COALESCE(NEW.full_name, split_part(NEW.email, '@', 1)) || '''s Team',
    NEW.id::TEXT,
    NEW.id,
    'free'
  )
  RETURNING id INTO new_team_id;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, NEW.id, 'owner');

  UPDATE public.users SET current_team_id = new_team_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_team();
