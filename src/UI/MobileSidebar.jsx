import { X, LayoutGrid } from "lucide-react";
import { useEffect, useRef } from "react";
import ProfileCard from "./ProfileCard";
import { useCategories } from "../hooks/useNews";
import { getCategoryIcon } from "../utils/categoryIcons";

const HASH = <span className="text-sm font-semibold">#</span>;

export default function MobileSidebar({
  isOpen,
  onClose,
  activeCategory,
  onCategoryChange,
}) {
  const sidebarRef = useRef(null);
  const { data: categories = [] } = useCategories();

  // Lock body scroll & close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  function handleBackdropClick(e) {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
      onClose();
    }
  }

  function handleCategoryClick(key) {
    onCategoryChange?.(key);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" onClick={handleBackdropClick}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 mobile-sidebar-backdrop" />

      {/* Sidebar panel — slides from right (RTL) */}
      <div
        ref={sidebarRef}
        className="absolute top-0 right-0 h-full w-70 sm:w-80 bg-gray-900 mobile-sidebar-enter overflow-y-auto border-l border-gray-800 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800/50">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-sm font-bold text-white">القائمة</h3>
          <div className="w-8" />
        </div>

        {/* Profile Card */}
        <div className="p-4">
          <ProfileCard />
        </div>

        {/* Categories */}
        <div className="px-4 pb-8">
          <div className="rounded-2xl border border-gray-800 bg-gray-800/30 p-4">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">
              التصنيفات
            </h4>
            <nav className="space-y-1.5">
              {/* "All" option */}
              <button
                onClick={() => handleCategoryClick("all")}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition cursor-pointer active:scale-[0.98] ${
                  activeCategory === "all"
                    ? "bg-teal-900/30 text-teal-400 border border-teal-500/20 shadow-sm"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${activeCategory === "all" ? "bg-teal-500/20" : "bg-gray-700/30"}`}>
                  <LayoutGrid className="h-4 w-4" />
                </div>
                كل المواضيع
              </button>
              {/* Dynamic categories from DB */}
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition cursor-pointer active:scale-[0.98] ${
                    activeCategory === cat.slug
                      ? "bg-teal-900/30 text-teal-400 border border-teal-500/20 shadow-sm"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent"
                  }`}
                >
                  <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${activeCategory === cat.slug ? "bg-teal-500/20" : "bg-gray-700/30"}`}>
                    <span className="text-base leading-none">{cat.emoji || getCategoryIcon(cat.slug || cat.name)}</span>
                  </div>
                  {cat.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
