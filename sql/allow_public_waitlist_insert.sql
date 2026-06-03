-- Use this only if you want the deployed API to insert with the public anon key.
-- Preferred production setup: set SUPABASE_SERVICE_ROLE_KEY in Vercel instead.

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_insert_waitlist" ON waitlist;

CREATE POLICY "allow_insert_waitlist" ON waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);
