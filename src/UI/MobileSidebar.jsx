import { X, LayoutGrid } from "lucide-react";
import { useEffect, useRef } from "react";
import ProfileCard from "./ProfileCard";
import { useCategories } from "../hooks/useNews";

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
        className="absolute top-0 right-0 h-full w-70 sm:w-80 bg-gray-50 mobile-sidebar-enter overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-sm font-bold text-gray-800">القائمة</h3>
          <div className="w-8" />
        </div>

        {/* Profile Card */}
        <div className="p-4">
          <ProfileCard />
        </div>

        {/* Categories */}
        <div className="px-4 pb-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
              التصنيفات
            </h4>
            <nav className="space-y-1">
              {/* "All" option */}
              <button
                onClick={() => handleCategoryClick("all")}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition cursor-pointer ${
                  activeCategory === "all"
                    ? "bg-teal-50 text-teal-800"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                كل المواضيع
              </button>
              {/* Dynamic categories from DB */}
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition cursor-pointer ${
                    activeCategory === cat.slug
                      ? "bg-teal-50 text-teal-800"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {HASH}
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
