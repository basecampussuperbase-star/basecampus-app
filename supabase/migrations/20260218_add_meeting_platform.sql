ALTER TABLE courses ADD COLUMN IF NOT EXISTS meeting_platform text CHECK (meeting_platform IN ('zoom', 'meet', 'tea'));
