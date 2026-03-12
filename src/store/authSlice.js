import { createSlice } from "@reduxjs/toolkit";

/**
 * Auth slice – stores authenticated user state and profile.
 *
 * Shape:
 *  - user: Supabase Auth user object (from session.user)
 *  - profile: Row from public.users table
 *  - isAuthenticated: boolean
 *  - isDemoMode: true when user is browsing without auth (demo mode)
 *  - isLoading: true until initial auth check completes
 */
const initialState = {
  user: null,
  profile: null,
  isAuthenticated: false,
  isDemoMode: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      const { user, profile } = action.payload;
      state.user = user;
      state.profile = profile || null;
      state.isAuthenticated = !!user;
      state.isDemoMode = false;
      state.isLoading = false;
    },
    setProfile(state, action) {
      state.profile = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.profile = null;
      state.isAuthenticated = false;
      // Preserve isDemoMode — only setUser or setDemoMode(false) should clear it
      state.isLoading = false;
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    setDemoMode(state, action) {
      state.isDemoMode = action.payload;
      state.isAuthenticated = false;
      state.user = null;
      state.profile = null;
      state.isLoading = false;
    },
  },
});

export const { setUser, setProfile, clearAuth, setLoading, setDemoMode } =
  authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectProfile = (state) => state.auth.profile;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsDemoMode = (state) => state.auth.isDemoMode;
export const selectIsAuthLoading = (state) => state.auth.isLoading;
export const selectUserRole = (state) => state.auth.profile?.role || "USER";

/**
 * Derive isPremium from user_subscriptions.
 * Premium if: has active/trial subscription + plan slug is "premium"
 * or can_see_ai_analysis feature is enabled.
 */
export const selectIsPremium = (state) => {
  const profile = state.auth.profile;
  if (!profile) return false;

  // Check if has active/trial subscription with premium plan
  const activeSubscription = (profile.user_subscriptions || []).find(
    (sub) =>
      (sub.status === "ACTIVE" || sub.status === "TRIAL") &&
      sub.subscription_plans?.slug === "premium",
  );

  return !!activeSubscription;
};

export default authSlice.reducer;
