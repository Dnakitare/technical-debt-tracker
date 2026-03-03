CREATE POLICY "Team admins can update member roles"
  ON public.team_members FOR UPDATE
  USING (team_id IN (
    SELECT team_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));
