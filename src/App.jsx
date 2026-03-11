import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import SplashScreen from "./UI/SplashScreen";
import ProtectedRoute from "./routes/ProtectedRoute";
import AuthCallback from "./routes/AuthCallback";
import { useAuthListener } from "./hooks/useAuth";

const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Feed = lazy(() => import("./pages/Feed"));
const Profile = lazy(() => import("./pages/Profile"));
const Saved = lazy(() => import("./pages/Saved"));
const Posts = lazy(() => import("./pages/Posts"));
const AppLayout = lazy(() => import("./UI/AppLayout"));

export default function App() {
  // Single auth listener for the entire app — handles session bootstrap
  // and onAuthStateChange. No other component should set up its own listener.
  useAuthListener();

  return (
    <BrowserRouter>
      <Suspense fallback={<SplashScreen />}>
        <Routes>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="auth/callback" element={<AuthCallback />} />
          <Route element={<AppLayout />}>
            <Route
              path="/feed"
              element={
                <ProtectedRoute allowDemo>
                  <Feed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <Saved />
                </ProtectedRoute>
              }
            />
            <Route path="/posts/:id" element={<Posts />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
