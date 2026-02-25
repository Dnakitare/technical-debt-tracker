-- =============================================================================
-- Team Invites
-- =============================================================================

CREATE TABLE public.team_invites (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id         UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  UNIQUE(team_id, email)
);

CREATE INDEX idx_team_invites_team_id ON public.team_invites(team_id);
CREATE INDEX idx_team_invites_email ON public.team_invites(email);
CREATE INDEX idx_team_invites_status ON public.team_invites(status);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Team members can view invites for their team
CREATE POLICY "Team members can view invites"
  ON public.team_invites FOR SELECT
  USING (team_id IN (SELECT public.get_user_team_ids()));

-- Team admins/owners can create invites
CREATE POLICY "Team admins can create invites"
  ON public.team_invites FOR INSERT
  WITH CHECK (team_id IN (
    SELECT team_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Team admins/owners can delete (cancel) invites
CREATE POLICY "Team admins can delete invites"
  ON public.team_invites FOR DELETE
  USING (team_id IN (
    SELECT team_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Allow updating invite status (for accepting/declining)
CREATE POLICY "Team admins can update invites"
  ON public.team_invites FOR UPDATE
  USING (team_id IN (
    SELECT team_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));
