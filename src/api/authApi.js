import { supabase } from "../lib/supabaseClient";

/**
 * Sign up a new user with email/password and profile metadata.
 * After Supabase Auth signup, inserts a row into the public.users table.
 */
export async function signUp({ email, password, fullName, phone, location }) {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        display_name: fullName,
        phone,
        location,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (authError) throw authError;

  // 2. Insert profile row in public.users (if RLS allows, or use trigger)
  // The user row may be created by a database trigger on auth.users insert.
  // If not, we create it here:
  if (authData.user) {
    const { error: profileError } = await supabase.from("users").upsert(
      {
        uuid: authData.user.id,
        email,
        full_name: fullName,
        display_name: fullName,
        location,
        role: "USER",
        status: "PENDING_VERIFICATION",
        language: "ar",
      },
      { onConflict: "uuid" },
    );

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Don't throw – auth user was created successfully
    }
  }

  // If session is null the user needs to confirm their email first.
  // Even if Supabase auto-confirmed ("Confirm email" disabled in dashboard),
  // we force-sign-out so the user must verify via the confirmation link.
  const needsEmailConfirmation = authData.user && !authData.session;

  if (!needsEmailConfirmation && authData.session) {
    // Supabase auto-logged the user in (email confirmation disabled in dashboard).
    // Sign out immediately so the flow stays consistent – the user should
    // verify their email before accessing the app.
    await supabase.auth.signOut();
  }

  return { ...authData, needsEmailConfirmation: true };
}

/**
 * Sign in with email and password.
 */
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Update last_login_at
  if (data.user) {
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("uuid", data.user.id);
  }

  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return { success: true };
}

/**
 * Get the current session (null if not authenticated).
 */
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Fetch the public.users profile for the authenticated user.
 * First tries by uuid; if not found, falls back to email and fixes the uuid.
 */
export async function getUserProfile(uuid, email) {
  // 1. Try by uuid
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      *,
      user_subscriptions (
        *,
        subscription_plans (*)
      )
    `,
    )
    .eq("uuid", uuid)
    .maybeSingle();

  if (data) return data;

  // 2. Fallback: look up by email (handles UUID mismatch after re-signup)
  if (email) {
    const { data: emailData, error: emailError } = await supabase
      .from("users")
      .select(
        `
        *,
        user_subscriptions (
          *,
          subscription_plans (*)
        )
      `,
      )
      .eq("email", email)
      .maybeSingle();

    if (emailData) {
      // Fix the uuid mismatch silently
      await supabase.from("users").update({ uuid }).eq("id", emailData.id);
      return { ...emailData, uuid };
    }
    if (emailError) throw emailError;
  }

  if (error) throw error;
  return null;
}

/**
 * Ensure a public.users profile exists for the given auth user.
 * If the profile wasn't created during signup (e.g. RLS blocked the insert
 * because the user had no session yet), create it now from auth metadata.
 */
export async function ensureUserProfile(user) {
  // 1. Try existing profile
  const existing = await getUserProfile(user.id, user.email).catch(() => null);
  if (existing) return existing;

  // 2. Profile missing – create from auth user_metadata
  const meta = user.user_metadata || {};
  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        uuid: user.id,
        email: user.email,
        full_name: meta.full_name || meta.display_name || "",
        display_name: meta.display_name || meta.full_name || "",
        location: meta.location || "",
        role: "USER",
        status: "ACTIVE",
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        language: "ar",
      },
      { onConflict: "uuid" },
    )
    .select(
      `
      *,
      user_subscriptions (
        *,
        subscription_plans (*)
      )
    `,
    )
    .single();

  if (error) {
    console.error("ensureUserProfile: failed to create profile", error);
    return null;
  }
  return data;
}

/**
 * Update the public.users profile for the authenticated user.
 */
export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from("users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
