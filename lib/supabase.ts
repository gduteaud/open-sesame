import { createClient } from "@supabase/supabase-js";

/**
 * Optional Supabase client for dashboard / realtime features.
 * Core app data uses Drizzle + DATABASE_URL; set these if you use Supabase APIs.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}
