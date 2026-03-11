import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in .env",
  );
}

/**
 * Single Supabase client instance for the entire app.
 * Do NOT create additional clients elsewhere – multiple instances fight
 * over the same Navigator LockManager lock and cause 10 s timeouts.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Use localStorage instead of the default lock-based storage to avoid
    // Navigator LockManager contention in StrictMode / across tabs.
    flowType: "pkce",
    storageKey: "sb-trendy-auth-token",
  },
});
