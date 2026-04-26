import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Lazily created so the app still runs without env vars (mock mode)
let _client = null;

export function getSupabase() {
  if (!isSupabaseConfigured) return null;
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return _client;
}

// Returns the current user's ID, signing in anonymously if needed.
// Anonymous auth must be enabled in your Supabase dashboard:
//   Authentication → Providers → Anonymous  → Enable
export async function getOrCreateSession() {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error('[Supabase] Anonymous sign-in failed:', error.message);
    return null;
  }
  return data.user?.id ?? null;
}

// Upload a file to Supabase Storage and return its public path.
// Bucket "resumes" must exist (created in schema.sql).
export async function uploadResumeFile(userId, file) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('resumes')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    console.error('[Supabase Storage] Upload failed:', error.message);
    return null;
  }
  return path;
}

// Download the stored resume file and return a temporary URL.
export function getResumeFileUrl(storagePath) {
  const supabase = getSupabase();
  if (!supabase || !storagePath) return null;
  const { data } = supabase.storage.from('resumes').getPublicUrl(storagePath);
  return data?.publicUrl ?? null;
}
