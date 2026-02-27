-- Add Slack integration columns to teams table
ALTER TABLE public.teams
  ADD COLUMN slack_team_id TEXT,
  ADD COLUMN slack_bot_token TEXT,
  ADD COLUMN slack_channel_id TEXT,
  ADD COLUMN slack_webhook_url TEXT;
