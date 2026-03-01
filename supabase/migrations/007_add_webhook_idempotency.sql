-- Track processed webhook events for idempotency
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Auto-clean events older than 7 days (Stripe retries within 3 days)
CREATE INDEX idx_processed_webhook_events_created_at
  ON processed_webhook_events (created_at);

-- RLS: only service role should access this table
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;
