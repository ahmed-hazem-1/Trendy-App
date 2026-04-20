import { X, LayoutGrid, Crown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCategories } from "../hooks/useNews";
import { useCategoryNavigation } from "../hooks/useCategoryNavigation";
import PremiumModal from "./PremiumModal";

const HASH = <span className="text-sm font-semibold">#</span>;

export default function BottomSheet({ isOpen, onClose, activeCategory, onCategoryChange }) {
  const sheetRef = useRef(null);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const { data: categories = [] } = useCategories();
  const navigateToFeedWithCategory = useCategoryNavigation();
  
  // Smart handler: if onCategoryChange is provided (Feed context), use it
  // Otherwise, navigate to /feed with the category
  const handleCategorySelection = (category) => {
    if (onCategoryChange) {
      onCategoryChange(category);
    } else {
      navigateToFeedWithCategory(category);
    }
    onClose();
  };

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
    handleCategorySelection(key);
  }

  function handlePremiumClick() {
    onClose?.();
    setPremiumOpen(true);
  }

  return (
    <div
      className={`fixed inset-0 z-[60] lg:hidden flex items-end md:items-center justify-center transition-[opacity] duration-300 ${
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

      {/* Bottom Sheet — slides from bottom on mobile, pops up on md */}
      <div
        ref={sheetRef}
        className={`relative w-full md:w-[400px] bg-white transition-transform duration-300 rounded-t-3xl md:rounded-3xl max-h-[70vh] md:max-h-[85vh] overflow-y-auto shadow-xl ${
          isOpen ? "translate-y-0 md:scale-100" : "translate-y-full md:translate-y-0 md:scale-95"
        }`}
      >
        {/* Handle bar - Hide on md */}
        <div className="flex justify-center pt-3 pb-2 md:hidden">
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
        <div className="px-5 pb-6 pt-4">
          <nav className="grid grid-cols-2 gap-3">
            {/* "All" option - Always full width */}
            <button
              onClick={() => handleCategoryClick("all")}
              className={`col-span-2 flex items-center justify-center gap-3 rounded-2xl px-4 py-4 text-sm font-bold transition-all transform active:scale-[0.98] cursor-pointer ${
                activeCategory === "all"
                  ? "bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/25 border-transparent"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/60"
              }`}
            >
              <div className={`flex items-center justify-center shrink-0 w-8 h-8 rounded-full ${activeCategory === "all" ? "bg-white/20 text-white" : "bg-white text-teal-600 shadow-sm"}`}>
                <LayoutGrid className="h-4 w-4" />
              </div>
              <span className="text-base">كل المواضيع</span>
            </button>

            {/* Dynamic categories from DB */}
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all transform active:scale-[0.98] cursor-pointer ${
                  activeCategory === cat.slug
                    ? "bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-500/25 border-transparent"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/60"
                }`}
              >
                <div className={`flex items-center justify-center shrink-0 w-8 h-8 rounded-full ${activeCategory === cat.slug ? "bg-white/20 text-white" : "bg-white text-teal-600 shadow-sm"}`}>
                  <span className="text-lg leading-none">{cat.emoji || HASH}</span>
                </div>
                <span className="text-sm truncate">{cat.name}</span>
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
