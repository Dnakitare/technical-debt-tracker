-- Deny all non-service-role access to processed_webhook_events
-- This table should only be accessed by the service role (server-side)
CREATE POLICY "Deny all non-service-role access"
  ON processed_webhook_events FOR ALL USING (false);
