import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import {
  signIn,
  signUp,
  signOut,
  getUserProfile,
  ensureUserProfile,
  upgradeToPremium,
  cancelSubscription as cancelUserSubscription,
  refreshUserWithSubscriptions,
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
  selectIsPremium,
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

  // Guard: skip onAuthStateChange SIGNED_IN events while signup is active.
  // Use the shared module-level ref so the signup mutation and listener stay in sync.
  const signupInProgressRef = _signupInProgressRef;

  useEffect(() => {
    let mounted = true;

    // 1. Get existing session
    async function init() {
      // Hard timeout: if getSession() hangs, force-clear stale tokens after 2 seconds.
      const lockTimeoutId = setTimeout(() => {
        if (!mounted) return;
        localStorage.removeItem("sb-trendy-auth-token");
        sessionStorage.clear();
        if (mounted) dispatch(clearAuth());
      }, 2000);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        clearTimeout(lockTimeoutId);

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
          
          // Invalidate queries on initial session bootstrap
          if (window._reactQueryClient) {
            window._reactQueryClient.invalidateQueries();
          }
        } else if (mounted) {
          dispatch(clearAuth());
        }
      } catch (err) {
        clearTimeout(lockTimeoutId);
        // Navigator LockManager timeout – clear stale tokens and reset
        if (
          err?.message?.includes("LockManager") ||
          err?.name === "NavigatorLockAcquireTimeoutError"
        ) {
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
        const isInitial = event === "INITIAL_SESSION";

        if ((event === "SIGNED_IN" || isInitial) && session?.user) {
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
          
          // Invalidate all queries to refresh data with new session
          if (window._reactQueryClient) {
            window._reactQueryClient.invalidateQueries();
          }
        } else if (event === "SIGNED_OUT") {
          dispatch(clearAuth());
          
          // Clear all cached queries on logout
          if (window._reactQueryClient) {
            window._reactQueryClient.clear();
          }
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

    // 3. Proactive session recovery when returning from idle / reconnecting
    //    This prevents the "first API call after idle fails" scenario.
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible" || !mounted) return;
      try {
        // getSession() will auto-refresh if the token is expired,
        // thanks to the in-memory lock serialising refresh attempts.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          dispatch(
            setUser({ user: session.user, profile: profileRef.current }),
          );
          // Refetch stale queries when returning to the tab
          if (window._reactQueryClient) {
            window._reactQueryClient.invalidateQueries();
          }
        }
      } catch {
        // Swallow – the next user interaction will retry
      }
    };

    const handleOnline = async () => {
      if (!mounted) return;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          dispatch(
            setUser({ user: session.user, profile: profileRef.current }),
          );
          if (window._reactQueryClient) {
            window._reactQueryClient.invalidateQueries();
          }
        }
      } catch {
        // Swallow
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
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
  const queryClient = useQueryClient();
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsAuthLoading);
  const role = useSelector(selectUserRole);

  // Make queryClient available globally for auth listener
  useEffect(() => {
    window._reactQueryClient = queryClient;
  }, [queryClient]);

  // ── Mutations ──

  const loginMutation = useMutation({
    mutationFn: async (args) => {
      const result = await signIn(args);
      
      // Small delay to ensure session propagates before UI updates
      // The onAuthStateChange listener handles Redux state updates
      await new Promise(resolve => setTimeout(resolve, 250));
      
      return result;
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
      // Clear all storage to prevent stale session issues
      localStorage.removeItem("sb-trendy-auth-token");
      sessionStorage.clear();
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

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("No user profile");
      return upgradeToPremium(profile.id);
    },
    onSuccess: async () => {
      // Refresh profile to update subscription state
      if (user?.id) {
        const updated = await refreshUserWithSubscriptions(
          user.id,
          user.email,
        ).catch(() => null);
        if (updated) dispatch(setProfile(updated));
      }
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId) => {
      if (!subscriptionId) throw new Error("No subscription id");
      return cancelUserSubscription(subscriptionId);
    },
    onSuccess: async () => {
      if (user?.id) {
        const updated = await refreshUserWithSubscriptions(
          user.id,
          user.email,
        ).catch(() => null);
        if (updated) dispatch(setProfile(updated));
      }
    },
  });

  return {
    // State
    user,
    profile,
    isAuthenticated,
    isLoading,
    role,
    isPremium: useSelector(selectIsPremium),

    // Actions
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    refreshProfile,
    upgradeToPremium: upgradeMutation.mutateAsync,
    cancelSubscription: cancelSubscriptionMutation.mutateAsync,

    // Mutation states
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    signupLoading: signupMutation.isPending,
    signupError: signupMutation.error,
    logoutLoading: logoutMutation.isPending,
    upgradeLoading: upgradeMutation.isPending,
    upgradeError: upgradeMutation.error,
    cancelLoading: cancelSubscriptionMutation.isPending,
    cancelError: cancelSubscriptionMutation.error,
  };
}
