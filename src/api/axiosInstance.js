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

// ─────────────────────────────────────────────
// Token refresh mutex — prevents multiple concurrent refreshes
// ─────────────────────────────────────────────
let _isRefreshing = false;
let _refreshSubscribers = [];

/** Notify all queued requests that a new token is available. */
function _onRefreshComplete(newToken) {
  _refreshSubscribers.forEach((cb) => cb(newToken));
  _refreshSubscribers = [];
}

/** Queue a request to be retried once the in-flight refresh completes. */
function _waitForRefresh() {
  return new Promise((resolve) => {
    _refreshSubscribers.push((token) => resolve(token));
  });
}

// ─────────────────────────────────────────────
// Request interceptor – attach bearer token from current session
// ─────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    // Single getSession() call — no retry loop needed.
    // The in-memory lock in supabaseClient.js serializes concurrent
    // refresh attempts, so the returned session is always fresh.
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

// ─────────────────────────────────────────────
// Response interceptor – handle expired sessions / unauthorized
// Retries the original request ONCE after a successful token refresh.
// ─────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt recovery on 401 and only once per request
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If a refresh is already in progress, wait for it instead of
    // firing a second concurrent refresh (which would race).
    if (_isRefreshing) {
      try {
        const newToken = await _waitForRefresh();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    // This is the first 401 — attempt the refresh
    _isRefreshing = true;
    try {
      const { data, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError || !data.session) {
        // Session truly expired — sign out
        _onRefreshComplete(null);
        await supabase.auth.signOut();
        return Promise.reject(error);
      }

      const newToken = data.session.access_token;

      // Notify all queued requests
      _onRefreshComplete(newToken);

      // Retry the original request with the fresh token
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshErr) {
      _onRefreshComplete(null);
      return Promise.reject(refreshErr);
    } finally {
      _isRefreshing = false;
    }
  },
);

export default api;
