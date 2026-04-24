import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import SplashScreen from "./UI/SplashScreen";
import ProtectedRoute from "./routes/ProtectedRoute";
import AuthCallback from "./routes/AuthCallback";
import { useAuthListener } from "./hooks/useAuth";
import AdminRoute from "./routes/AdminRoute";

const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Feed = lazy(() => import("./pages/Feed"));
const Profile = lazy(() => import("./pages/Profile"));
const Saved = lazy(() => import("./pages/Saved"));
const Posts = lazy(() => import("./pages/Posts"));
const AppLayout = lazy(() => import("./UI/AppLayout"));
const AdminLayout = lazy(() => import("./UI/AdminLayout"));
const About = lazy(() => import("./pages/About"));

// Admin Pages
const CategorySourceManager = lazy(() => import("./pages/CategorySourceManager"));
const AdManager = lazy(() => import("./pages/AdManager"));
const AdminUserManager = lazy(() => import("./pages/AdminUserManager"));

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
          
          {/* Admin Routes - Protected by AdminRoute */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<Navigate to="/admin/sources" replace />} />
            <Route path="sources" element={<CategorySourceManager />} />
            <Route path="ads" element={<AdManager />} />
            <Route path="users" element={<AdminUserManager />} />
          </Route>

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
            <Route path="/about" element={<About />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
