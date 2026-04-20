import { Home, Compass, Bookmark, User, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function BottomNav({ onCategoriesOpen, onAdminModalOpen }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { profile } = useAuth();
  const profileLink = profile?.id ? `/profile/${profile.id}` : "/login";
  const isAdmin = profile?.role === "ADMIN";

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navItems = [
    {
      id: "home",
      label: "الرئيسية", // Home
      icon: Home,
      isActive: currentPath === "/feed",
      to: "/feed",
    },
    {
      id: "explore",
      label: "استكشف", // Explore
      icon: Compass,
      isActive: false, // Opens sheet, no active route state
      onClick: onCategoriesOpen,
    },
    ...(isAdmin
      ? [
          {
            id: "admin",
            label: "مسؤول", // Admin
            icon: Settings,
            isActive: currentPath.startsWith("/admin"),
            onClick: onAdminModalOpen,
          },
        ]
      : []),
    {
      id: "saved",
      label: "المحفوظات", // Saved
      icon: Bookmark,
      isActive: currentPath === "/saved",
      to: "/saved",
    },
    {
      id: "profile",
      label: "حسابي", // Profile
      icon: User,
      isActive: currentPath.startsWith("/profile"),
      to: profileLink,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-5 inset-x-4 z-50 flex flex-col items-center justify-end pointer-events-none pb-[env(safe-area-inset-bottom)]">
      
      {/* Main Bottom Bar Pill */}
      <div className="bg-gray-900 rounded-[2rem] shadow-2xl flex items-center justify-between px-2 h-16 w-full max-w-sm pointer-events-auto border border-gray-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          const content = (
            <div
              className={`flex items-center justify-center gap-2.5 transition-all duration-300 ease-out cursor-pointer ${
                item.isActive
                  ? "bg-teal-600 px-5 py-2.5 rounded-full text-white"
                  : "text-gray-400 hover:text-white p-2.5 hover:bg-gray-800 rounded-full"
              }`}
            >
              <Icon className="h-6 w-6 shrink-0" strokeWidth={item.isActive ? 2.5 : 2} />
              
              {/* Only show the text if the item is active, providing the "expanding pill" effect */}
              {item.isActive && (
                <span className="text-sm font-bold tracking-wide whitespace-nowrap truncate animate-in sm:animate-in slide-in-from-right-4 fade-in duration-300">
                  {item.label}
                </span>
              )}
            </div>
          );

          if (item.to) {
            return (
              <Link 
                key={item.id} 
                to={item.to} 
                className="outline-none rounded-full"
                onClick={(e) => {
                  // If tapping active home button again, scroll to top natively.
                  if (item.isActive && item.id === "home") {
                    e.preventDefault();
                    scrollToTop();
                  }
                }}
              >
                {content}
              </Link>
            );
          }

          return (
            <button key={item.id} onClick={item.onClick} className="outline-none rounded-full cursor-pointer relative overflow-hidden">
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
