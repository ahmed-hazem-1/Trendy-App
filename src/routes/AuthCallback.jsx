import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import SplashScreen from "../UI/SplashScreen";

/**
 * AuthCallback – handles the redirect from Supabase email confirmation / OAuth.
 *
 * When a user clicks the email confirmation link, Supabase redirects to
 * <site>/auth/callback#access_token=...&type=signup (or recovery, etc.).
 *
 * This component:
 *  1. Waits for Supabase to exchange the URL token for a session
 *     (detectSessionInUrl: true in supabaseClient does the heavy lifting)
 *  2. Once a session exists, redirects to /feed
 *  3. If no session after timeout, redirects to /login
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      // Give Supabase a moment to detect tokens in the URL fragment
      // and exchange them for a session via PKCE.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session) {
        navigate("/feed", { replace: true });
      } else {
        // Session not ready yet – listen for the auth event
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (!mounted) return;
          if (event === "SIGNED_IN" && session) {
            subscription.unsubscribe();
            navigate("/feed", { replace: true });
          }
        });

        // Safety timeout – if nothing happens in 10s, go to login
        setTimeout(() => {
          if (mounted) {
            subscription.unsubscribe();
            navigate("/login", { replace: true });
          }
        }, 10000);
      }
    }

    handleCallback();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  return <SplashScreen />;
}
