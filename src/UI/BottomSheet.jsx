import { X, LayoutGrid, Crown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCategories } from "../hooks/useNews";
import PremiumModal from "./PremiumModal";

const HASH = <span className="text-sm font-semibold">#</span>;

export default function BottomSheet({ isOpen, onClose, activeCategory, onCategoryChange }) {
  const sheetRef = useRef(null);
  const [premiumOpen, setPremiumOpen] = useState(false);
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
    if (sheetRef.current && !sheetRef.current.contains(e.target)) {
      onClose();
    }
  }

  function handleCategoryClick(key) {
    onCategoryChange?.(key);
    onClose();
  }

  function handlePremiumClick() {
    onClose?.();
    setPremiumOpen(true);
  }

  return (
    <div
      className={`fixed inset-0 z-[60] lg:hidden transition-[opacity] duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleBackdropClick}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Bottom Sheet — slides from bottom */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white transition-transform duration-300 rounded-t-3xl max-h-[70vh] overflow-y-auto ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          borderTopLeftRadius: "1.5rem",
          borderTopRightRadius: "1.5rem",
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="w-8" />
          <h3 className="text-base font-bold text-gray-800">التصنيفات</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Categories */}
        <div className="px-4 pb-6 pt-4">
          <nav className="space-y-2">
            {/* "All" option */}
            <button
              onClick={() => handleCategoryClick("all")}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition cursor-pointer ${
                activeCategory === "all"
                  ? "bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-800 border-2 border-teal-200"
                  : "text-gray-600 hover:bg-gray-50 border-2 border-transparent"
              }`}
            >
              <LayoutGrid className="h-5 w-5" />
              <span className="text-base">كل المواضيع</span>
            </button>

            {/* Dynamic categories from DB */}
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition cursor-pointer ${
                  activeCategory === cat.slug
                    ? "bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-800 border-2 border-teal-200"
                    : "text-gray-600 hover:bg-gray-50 border-2 border-transparent"
                }`}
              >
                <span className="text-lg">{cat.emoji || HASH}</span>
                <span className="text-base">{cat.name}</span>
              </button>
            ))}
          </nav>

          {/* Premium Box */}
          <div className="mt-6 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-500 p-4 text-white relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/10" />

            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Crown className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold">Trendy Premium</h4>
                <p className="text-xs text-white/90 line-clamp-2">
                  تحليلات متقدمة • تحقق أسرع • بدون إعلانات
                </p>
              </div>
              <button
                onClick={handlePremiumClick}
                className="shrink-0 bg-white text-teal-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-teal-50 transition cursor-pointer"
              >
                جرّب
              </button>
            </div>
          </div>
        </div>
      </div>
      <PremiumModal isOpen={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </div>
  );
}
