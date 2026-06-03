-- Run this in Supabase SQL editor if duplicate waitlist emails are slipping through.
-- It removes duplicate rows, keeps the oldest signup per email, and enforces uniqueness.

DELETE FROM waitlist a
USING waitlist b
WHERE a.email = b.email
  AND a.subscribed_at > b.subscribed_at;

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_unique_idx ON waitlist (email);
