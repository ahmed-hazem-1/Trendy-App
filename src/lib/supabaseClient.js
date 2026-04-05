import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in .env",
  );
}

// ─────────────────────────────────────────────
// Cached session — updated on every auth event.
// Used as a fallback when getSession() hangs.
// ─────────────────────────────────────────────
let _cachedSession = null;

// ─────────────────────────────────────────────
// Simple no-op lock — bypasses Navigator LockManager entirely.
// ─────────────────────────────────────────────
function noopLock(_name, _acquireTimeout, fn) {
  return fn();
}

/**
 * Single Supabase client instance for the entire app.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    storageKey: "sb-trendy-auth-token",
    lock: noopLock,
  },
});

// Keep _cachedSession always up-to-date via auth state changes.
supabase.auth.onAuthStateChange((_event, session) => {
  _cachedSession = session;
});

// ─────────────────────────────────────────────
// CRITICAL FIX: Patch getSession() with a timeout.
//
// The Supabase JS client calls getSession() internally before
// every PostgREST request to inject the auth token. With the
// noopLock bypass, the auth client's internal initializePromise
// can get stuck after a few seconds, causing getSession() to
// hang forever and blocking ALL database queries.
//
// Fix: Race getSession() against a 3-second timeout. On hang,
// return the last known session from the onAuthStateChange cache.
// ─────────────────────────────────────────────
const _originalGetSession = supabase.auth.getSession.bind(supabase.auth);

supabase.auth.getSession = async function () {
  try {
    const result = await Promise.race([
      _originalGetSession(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("getSession() timeout")),
          3000,
        ),
      ),
    ]);

    if (result?.data?.session) {
      _cachedSession = result.data.session;
    }
    return result;
  } catch (err) {
    console.error("[Supabase] getSession() failed — falling back to cached session:", err.message);
    return { data: { session: _cachedSession }, error: null };
  }
};
