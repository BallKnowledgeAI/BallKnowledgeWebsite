CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  email TEXT NOT NULL CHECK (char_length(email) > 3),
  interest TEXT NOT NULL CHECK (interest IN ('prototype-testing', 'coach-analyst', 'research-collaboration', 'partnership', 'general')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 1000),
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);
