import { supabase } from "../lib/supabaseClient";

/**
 * Sign up a new user with email/password and profile metadata.
 * After Supabase Auth signup, inserts a row into the public.users table.
 */
export async function signUp({ email, password, fullName, phone, location, interests = [] }) {
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
        interests,
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
        phone,
        interests,
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

/**
 * Upgrade user to premium plan (starts trial if no active subscription).
 * Finds premium plan in DB and creates/updates user_subscriptions entry.
 * If plan doesn't exist, creates it automatically.
 */
export async function upgradeToPremium(userId) {
  // 1. Get premium plan or create if doesn't exist
  let { data: premiumPlan, error: planError } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("slug", "premium")
    .maybeSingle();

  if (planError) throw planError;

  // If premium plan doesn't exist, create it
  if (!premiumPlan) {
    const { data: newPlan, error: createError } = await supabase
      .from("subscription_plans")
      .insert({
        name: "Trendy Premium",
        slug: "premium",
        description: "الاشتراك البريميوم - بدون إعلانات وميزات متقدمة",
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.warn("Could not create premium plan:", createError);
      throw new Error("Failed to initialize premium plan");
    }
    premiumPlan = newPlan;
  }

  // 2. Check for existing subscription
  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_id", premiumPlan.id)
    .maybeSingle();

  // 3. Create or update subscription with TRIAL status
  const now = new Date().toISOString();
  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  if (existing) {
    // Reactivate: extend trial or keep active
    const { data, error } = await supabase
      .from("user_subscriptions")
      .update({
        status: "TRIAL",
        trial_ends_at: trialEndsAt,
        cancelled_at: null,
      })
      .eq("id", existing.id)
      .select(
        `
        *,
        subscription_plans (*)
      `,
      )
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new subscription
    const { data, error } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        plan_id: premiumPlan.id,
        status: "TRIAL",
        started_at: now,
        trial_ends_at: trialEndsAt,
      })
      .select(
        `
        *,
        subscription_plans (*)
      `,
      )
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Cancel an existing subscription immediately.
 * The frontend refreshes the profile afterward, so premium state drops out
 * of the Redux selector on the next sync.
 */
export async function cancelSubscription(subscriptionId) {
  if (!subscriptionId) {
    throw new Error("Missing subscription id");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "CANCELLED",
      cancelled_at: now,
    })
    .eq("id", subscriptionId)
    .select(
      `
        *,
        subscription_plans (*)
      `,
    );

  if (error) throw error;
  return data?.[0] || null;
}

/**
 * Refresh user profile with fresh subscription data.
 * Call after upgrading to get updated isPremium state.
 */
export async function refreshUserWithSubscriptions(userId, email) {
  return getUserProfile(userId, email);
}
