import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
import { Link } from "react-router-dom";
import benhaLogo from "../images/benha_university_logo.png";
import { Search, X, Menu } from "lucide-react";
import { useState } from "react";

export default function NavBar({ onMenuClick }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      <nav className="max-w-6xl w-full mx-auto flex items-center justify-between h-[56px] px-3 sm:px-6 lg:px-8">
        {/* يمين: البرغر + الشعار + البحث (RTL) */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-8 h-full">
          {/* Burger Menu — mobile/tablet only */}
          <button
            onClick={onMenuClick}
            className="hidden lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 transition cursor-pointer"
            aria-label="القائمة"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/feed" className="shrink-0 flex items-center h-full gap-4 sm:gap-6">
            <img
              src="/logo/Trendy - logo - with text.png"
              alt="Trendy"
              className="h-8 sm:h-10 w-auto object-contain scale-[2] sm:scale-150 origin-right"
            />
            <div className="h-6 w-px bg-gray-200 mx-2" />
            <img
              src={benhaLogo}
              alt="جامعة بنها"
              className="h-8 sm:h-10 w-auto object-contain scale-[1.2] sm:scale-110"
            />
          </Link>

          {/* Desktop search */}
          <div className="hidden md:flex items-center h-full">
            <SearchBar className="h-9" />
          </div>
        </div>

        {/* يسار: الإشعارات + المستخدم */}
        <div className="flex items-center gap-2 sm:gap-5 h-full">
          <Link
            to="/about"
            className="text-[11px] sm:text-sm font-bold text-gray-500 hover:text-teal-600 transition-colors"
          >
            عن التطبيق
          </Link>

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
