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
    const {
      data: { session },
    } = await supabase.auth.getSession();

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
