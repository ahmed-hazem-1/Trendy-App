import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectIsDemoMode,
  selectIsAuthLoading,
} from "../store/authSlice";
import SplashScreen from "../UI/SplashScreen";

/**
 * ProtectedRoute – wraps around routes that require authentication.
 *
 * Behaviour:
 *  - While auth state is still loading → show splash screen
 *  - If allowDemo=true, allows demo users to access the route
 *  - If NOT authenticated (and not demo when allowed) → redirect to /login
 *  - If authenticated → render children
 */
export default function ProtectedRoute({ children, allowDemo = false }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isDemoMode = useSelector(selectIsDemoMode);
  const isLoading = useSelector(selectIsAuthLoading);
  const location = useLocation();

  if (isLoading) {
    return <SplashScreen />;
  }

  const hasAccess = isAuthenticated || (allowDemo && isDemoMode);

  if (!hasAccess) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
