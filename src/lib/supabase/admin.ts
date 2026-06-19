import { createClient } from '@supabase/supabase-js';

// Admin client that bypasses RLS using the service role key
// Only use this on the server side (API routes, server components)
//
// Required Vercel env vars:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY  (server-only; not the anon key)
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing Supabase URL env var: set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) in Vercel'
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      'Missing Supabase service role key: set SUPABASE_SERVICE_ROLE_KEY in Vercel (Project Settings → Environment Variables). This is the service_role secret from Supabase, not NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
