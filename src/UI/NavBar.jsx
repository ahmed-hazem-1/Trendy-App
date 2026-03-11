import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import { Link } from "react-router-dom";
import { Search, X, Menu } from "lucide-react";
import { useState } from "react";

export default function NavBar({ onMenuClick }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto flex items-center justify-between py-2 px-3 sm:px-4 lg:px-6">
        {/* يمين: البرغر + الشعار + البحث */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-8">
          {/* Burger icon — mobile/tablet only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/feed" className="shrink-0">
            <img
              src="/logo/Trendy - logo - with text.png"
              alt="Trendy"
              className="h-10 sm:h-12 lg:h-16 w-auto object-contain"
            />
          </Link>
          {/* Desktop search */}
          <div className="hidden md:block">
            <SearchBar />
          </div>
        </div>

        {/* يسار: الإشعارات + المستخدم */}
        <div className="flex items-center gap-2 sm:gap-5">
          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition cursor-pointer"
          >
            {searchOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </button>
          <NotificationBell />
          <span className="hidden sm:block h-8 w-px bg-gray-200" />
          <UserMenu />
        </div>
      </nav>

      {/* Mobile search bar — slides down */}
      {searchOpen && (
        <div className="md:hidden px-3 pb-3 border-t border-gray-100">
          <SearchBar fullWidth />
        </div>
      )}
    </header>
  );
}
