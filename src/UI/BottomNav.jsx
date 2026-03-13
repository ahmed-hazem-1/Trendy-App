import { Home, Compass, Bookmark, User, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function BottomNav({ onCategoriesOpen, onAdminModalOpen }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { profile } = useAuth();
  const profileLink = profile?.id ? `/profile/${profile.id}` : "/login";
  const isAdmin = profile?.role === "ADMIN";

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className={`grid ${isAdmin ? "grid-cols-5" : "grid-cols-4"} items-center h-16 px-2`}>
        {/* Home Button */}
        <Link
          to="/feed"
          className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition ${
            currentPath === "/feed"
              ? "text-teal-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Home className="h-6 w-6" strokeWidth={2.5} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Explore Button */}
        <button
          onClick={onCategoriesOpen}
          className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition text-gray-400 hover:text-gray-600"
        >
          <Compass className="h-6 w-6" strokeWidth={2.5} />
          <span className="text-[10px] font-medium">Explore</span>
        </button>

        {/* Admin Panel Button - Center for Admins Only */}
        {isAdmin && (
          <button
            onClick={onAdminModalOpen}
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition ${
              currentPath.startsWith("/admin")
                ? "text-teal-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Settings className="h-6 w-6" strokeWidth={2.5} />
            <span className="text-[10px] font-medium">Admin</span>
          </button>
        )}

        {/* Saved Button */}
        <Link
          to="/saved"
          className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition ${
            currentPath === "/saved"
              ? "text-teal-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Bookmark className="h-6 w-6" strokeWidth={2.5} />
          <span className="text-[10px] font-medium">Saved</span>
        </Link>

        {/* Profile Button */}
        <Link
          to={profileLink}
          className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition ${
            currentPath.startsWith("/profile")
              ? "text-teal-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <User className="h-6 w-6" strokeWidth={2.5} />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
