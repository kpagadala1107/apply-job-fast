// All Supabase database operations.
// Every function is a no-op if Supabase is not configured, so the app
// works in mock mode (no .env) without changes.

import { getSupabase } from './supabase';

// ─── Resume ──────────────────────────────────────────────────────────────────

export async function dbSaveResume({ userId, name, size, type, text, storagePath }) {
  const db = getSupabase();
  if (!db) return null;

  const { data, error } = await db
    .from('resumes')
    .upsert(
      {
        user_id: userId,
        name,
        size,
        type,
        text,
        storage_path: storagePath,
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) { console.error('[db] saveResume:', error.message); return null; }
  return data;
}

export async function dbLoadResume(userId) {
  const db = getSupabase();
  if (!db) return null;

  const { data, error } = await db
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) { console.error('[db] loadResume:', error.message); return null; }
  return data
    ? {
        name: data.name,
        size: data.size,
        type: data.type,
        text: data.text,
        storagePath: data.storage_path,
        uploadedAt: data.uploaded_at,
      }
    : null;
}

// ─── Tailored Resumes ────────────────────────────────────────────────────────

export async function dbSaveTailoredResume({ userId, jobId, content }) {
  const db = getSupabase();
  if (!db) return null;

  const { data, error } = await db
    .from('tailored_resumes')
    .upsert(
      {
        user_id: userId,
        job_id: jobId,
        content,
        estimated_score: content?.estimatedScore ?? null,
        tailored_for: content?.tailoredFor ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,job_id' }
    )
    .select()
    .single();

  if (error) { console.error('[db] saveTailoredResume:', error.message); return null; }
  return data;
}

export async function dbLoadTailoredResumes(userId) {
  const db = getSupabase();
  if (!db) return {};

  const { data, error } = await db
    .from('tailored_resumes')
    .select('job_id, content')
    .eq('user_id', userId);

  if (error) { console.error('[db] loadTailoredResumes:', error.message); return {}; }
  return Object.fromEntries((data ?? []).map((r) => [r.job_id, r.content]));
}

// ─── Applied Jobs ─────────────────────────────────────────────────────────────

export async function dbSaveAppliedJob({ userId, job }) {
  const db = getSupabase();
  if (!db) return null;

  const { data, error } = await db
    .from('applied_jobs')
    .upsert(
      {
        user_id: userId,
        job_id: job.id,
        job_title: job.title,
        job_company: job.company,
        job_portal: job.portal,
        job_location: job.location,
        job_salary: job.salary,
        applied_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,job_id' }
    )
    .select()
    .single();

  if (error) { console.error('[db] saveAppliedJob:', error.message); return null; }
  return data;
}

export async function dbLoadAppliedJobs(userId) {
  const db = getSupabase();
  if (!db) return [];

  const { data, error } = await db
    .from('applied_jobs')
    .select('job_id')
    .eq('user_id', userId)
    .order('applied_at', { ascending: false });

  if (error) { console.error('[db] loadAppliedJobs:', error.message); return []; }
  return (data ?? []).map((r) => r.job_id);
}
