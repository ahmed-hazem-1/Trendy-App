import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import {
  signIn,
  signUp,
  signOut,
  getUserProfile,
  ensureUserProfile,
} from "../api/authApi";
import {
  setUser,
  setProfile,
  clearAuth,
  selectUser,
  selectProfile,
  selectIsAuthenticated,
  selectIsAuthLoading,
  selectUserRole,
} from "../store/authSlice";

// ─────────────────────────────────────────────
// Auth Listener — call ONCE at the app root
// ─────────────────────────────────────────────

/**
 * One-time auth bootstrap & listener.
 * Must be called exactly once (e.g. in App.jsx) so there is a single
 * onAuthStateChange subscription for the entire app. Every other component
 * should use `useAuth()` which only reads Redux state + provides mutations.
 */
export function useAuthListener() {
  const dispatch = useDispatch();

  // Keep a live ref to the current profile so the TOKEN_REFRESHED handler
  // never captures a stale closure value.
  const profileRef = useRef(null);
  const profile = useSelector(selectProfile);
  profileRef.current = profile;

  // Guard: skip onAuthStateChange SIGNED_IN events while signup is active
  const signupInProgressRef = useRef(false);

  // Expose the signupInProgressRef so useAuth's signup mutation can set it
  // via a module-level variable (avoids prop-drilling).
  _signupInProgressRef = signupInProgressRef;

  useEffect(() => {
    let mounted = true;

    // 1. Get existing session
    async function init() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          const profileData = await ensureUserProfile(session.user).catch(
            () => null,
          );

          // Promote PENDING_VERIFICATION → ACTIVE on session bootstrap
          if (profileData && profileData.status === "PENDING_VERIFICATION") {
            const { data: updated } = await supabase
              .from("users")
              .update({
                status: "ACTIVE",
                email_verified: true,
                email_verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", profileData.id)
              .select()
              .single();
            if (updated) Object.assign(profileData, updated);
          }

          dispatch(setUser({ user: session.user, profile: profileData }));
        } else if (mounted) {
          dispatch(clearAuth());
        }
      } catch (err) {
        // Navigator LockManager timeout – clear stale tokens and reset
        if (
          err?.message?.includes("LockManager") ||
          err?.name === "NavigatorLockAcquireTimeoutError"
        ) {
          console.warn("Auth lock timeout – clearing stale session");
          localStorage.removeItem("sb-trendy-auth-token");
        }
        if (mounted) dispatch(clearAuth());
      }
    }

    init();

    // 2. Listen for future auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        if (event === "SIGNED_IN" && session?.user) {
          // Skip if a signup is in progress – the signup handler will take care
          if (signupInProgressRef.current) return;

          const profileData = await ensureUserProfile(session.user).catch(
            () => null,
          );

          // Promote PENDING_VERIFICATION → ACTIVE
          if (profileData && profileData.status === "PENDING_VERIFICATION") {
            const { data: updated } = await supabase
              .from("users")
              .update({
                status: "ACTIVE",
                email_verified: true,
                email_verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", profileData.id)
              .select()
              .single();
            if (updated) Object.assign(profileData, updated);
          }

          dispatch(setUser({ user: session.user, profile: profileData }));
        } else if (event === "SIGNED_OUT") {
          dispatch(clearAuth());
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          // Use the ref so we always have the latest profile, not a stale closure
          dispatch(
            setUser({ user: session.user, profile: profileRef.current }),
          );
        }
      } catch {
        // Swallow errors in the listener to avoid unhandled rejections
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);
}

// Module-level ref shared between useAuthListener and useAuth's signup mutation
let _signupInProgressRef = { current: false };

// ─────────────────────────────────────────────
// useAuth — safe to call from any component
// ─────────────────────────────────────────────

/**
 * Auth hook for components.
 * Reads Redux auth state and provides login / signup / logout mutations.
 * Does NOT set up listeners — that is handled once by useAuthListener().
 */
export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsAuthLoading);
  const role = useSelector(selectUserRole);

  // ── Mutations ──

  const loginMutation = useMutation({
    mutationFn: signIn,
    onSuccess: async (data) => {
      if (data.user) {
        const profileData = await ensureUserProfile(data.user).catch(
          () => null,
        );
        dispatch(setUser({ user: data.user, profile: profileData }));
      }
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (args) => {
      _signupInProgressRef.current = true;
      try {
        return await signUp(args);
      } finally {
        // Small delay so the onAuthStateChange handler sees the flag
        setTimeout(() => {
          _signupInProgressRef.current = false;
        }, 500);
      }
    },
    onSuccess: async () => {
      // signUp now always returns needsEmailConfirmation: true and signs
      // the user out, so we never set authenticated state here.
      // The Signup page will show the "check your email" message.
    },
  });

  const logoutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      dispatch(clearAuth());
    },
  });

  const refreshProfile = async () => {
    if (!user?.id) return;
    const profileData = await getUserProfile(user.id, user.email).catch(
      () => null,
    );
    if (profileData) dispatch(setProfile(profileData));
  };

  return {
    // State
    user,
    profile,
    isAuthenticated,
    isLoading,
    role,

    // Actions
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    refreshProfile,

    // Mutation states
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    signupLoading: signupMutation.isPending,
    signupError: signupMutation.error,
    logoutLoading: logoutMutation.isPending,
  };
}
