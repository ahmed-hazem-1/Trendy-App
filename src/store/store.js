import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        // Supabase user objects may contain non‑serializable dates; ignore those paths
        ignoredPaths: ["auth.user", "auth.profile"],
        ignoredActions: ["auth/setUser", "auth/setProfile"],
      },
    }),
});

export default store;
