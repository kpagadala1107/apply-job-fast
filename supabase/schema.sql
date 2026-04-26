-- ApplyFast — Supabase Schema
-- Run this entire file in the Supabase SQL Editor:
--   https://supabase.com/dashboard/project/<your-project>/sql/new
--
-- After running, also do these two things in the dashboard:
--   1. Authentication → Providers → Anonymous → Enable
--   2. Storage → New bucket → Name: "resumes" → Private ✓

-- ─── Tables ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS resumes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  size         INTEGER,
  type         TEXT,
  text         TEXT,
  storage_path TEXT,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)            -- one active resume per user
);

CREATE TABLE IF NOT EXISTS tailored_resumes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id          TEXT NOT NULL,
  content         JSONB NOT NULL,
  estimated_score SMALLINT,
  tailored_for    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS applied_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id       TEXT NOT NULL,
  job_title    TEXT,
  job_company  TEXT,
  job_portal   TEXT,
  job_location TEXT,
  job_salary   TEXT,
  applied_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

-- ─── Auto-update updated_at ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tailored_resumes_updated_at
  BEFORE UPDATE ON tailored_resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security ────────────────────────────────────────────────────
-- Each user (including anonymous) can only see and modify their own rows.

ALTER TABLE resumes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailored_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE applied_jobs    ENABLE ROW LEVEL SECURITY;

-- resumes
CREATE POLICY "resumes: owner access"
  ON resumes FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- tailored_resumes
CREATE POLICY "tailored_resumes: owner access"
  ON tailored_resumes FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- applied_jobs
CREATE POLICY "applied_jobs: owner access"
  ON applied_jobs FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Storage bucket policy ────────────────────────────────────────────────
-- Run this AFTER creating the "resumes" bucket in the dashboard.
-- The path convention is: resumes/{user_id}/{filename}

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "resumes storage: owner access"
  ON storage.objects FOR ALL
  USING      (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ─── Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_resumes_user          ON resumes (user_id);
CREATE INDEX IF NOT EXISTS idx_tailored_user_job     ON tailored_resumes (user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_applied_user          ON applied_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_applied_user_job      ON applied_jobs (user_id, job_id);
