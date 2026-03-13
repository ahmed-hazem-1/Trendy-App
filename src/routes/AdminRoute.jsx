import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectIsAuthLoading,
} from "../store/authSlice";
import { useAuth } from "../hooks/useAuth";
import SplashScreen from "../UI/SplashScreen";

/**
 * AdminRoute - specifically protects admin pages.
 * Ensures the user is both authenticated AND has the 'ADMIN' role.
 */
export default function AdminRoute({ children }) {
  const { profile } = useAuth();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsAuthLoading);
  const location = useLocation();

  if (isLoading) {
    return <SplashScreen />;
  }

  // Check for authentication and then specific role
  // Handle both string "ADMIN" and potential lowercase "admin" or other variants
  const isAuthorized = isAuthenticated && 
    (profile?.role === "ADMIN" || profile?.role?.toString().toUpperCase() === "ADMIN");

  if (!isAuthorized) {
    // If authenticated but not admin, send back to feed
    if (isAuthenticated) {
      return <Navigate to="/feed" replace />;
    }
    // If not authenticated, send to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
