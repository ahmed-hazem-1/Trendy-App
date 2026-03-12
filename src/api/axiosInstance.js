import axios from "axios";
import { supabase } from "../lib/supabaseClient";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

/**
 * Axios instance configured for Supabase REST API.
 * Automatically injects the current user's access token into every request.
 */
const api = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
});

// Request interceptor – attach bearer token from current session
api.interceptors.request.use(
  async (config) => {
    let session = null;
    let attempts = 0;
    const maxAttempts = 5;
    
    // Retry getting session with small delays to handle race conditions
    while (attempts < maxAttempts && !session) {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      
      if (currentSession?.access_token) {
        session = currentSession;
        break;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        // Small delay before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 50 * attempts));
      }
    }

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor – handle expired sessions / unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt to refresh
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        // Session truly expired – sign out
        await supabase.auth.signOut();
      }
    }
    return Promise.reject(error);
  },
);

export default api;
