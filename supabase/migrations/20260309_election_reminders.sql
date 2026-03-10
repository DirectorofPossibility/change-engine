-- Election reminders opt-in table
CREATE TABLE IF NOT EXISTS election_reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  zip_code text,
  reminder_types text[] DEFAULT ARRAY['registration', 'early_voting', 'election_day'],
  is_active boolean DEFAULT true,
  auth_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  unsubscribe_token uuid DEFAULT gen_random_uuid()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reminders_email ON election_reminders(email);

-- Track sent reminders to avoid duplicates
CREATE TABLE IF NOT EXISTS election_reminder_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reminder_id uuid REFERENCES election_reminders(id) ON DELETE CASCADE,
  election_id text,
  reminder_type text NOT NULL,        -- 'registration', 'early_voting', 'election_day'
  scheduled_date date NOT NULL,
  sent_at timestamptz DEFAULT now(),
  email_subject text,
  UNIQUE(reminder_id, election_id, reminder_type)
);
