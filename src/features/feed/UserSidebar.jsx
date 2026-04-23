import {
  LayoutGrid,
  Laptop,
  Scale,
  Trophy,
  Users,
  LineChart,
  Stethoscope,
  Microscope,
  Clapperboard,
  GraduationCap,
  Leaf,
  Shirt,
} from "lucide-react";

import { useSelector } from "react-redux";
import { selectIsPremium } from "../../store/authSlice";
import ProfileCard from "../../UI/ProfileCard";
import { useCategories } from "../../hooks/useNews";
import { useCategoryNavigation } from "../../hooks/useCategoryNavigation";
import { AdCard } from "../../UI/Ads";
import { MOCK_ADS } from "../../utils/adsData";

const CATEGORY_ICONS = {
  // English slugs
  technology: Laptop,
  tech: Laptop,
  politics: Scale,
  sports: Trophy,
  social: Users,
  health: Stethoscope,
  science: Microscope,
  entertainment: Clapperboard,
  education: GraduationCap,
  environment: Leaf,
  fashion: Shirt,
  other: LayoutGrid,
  general: LayoutGrid,

  // Arabic names/slugs
  "تكنولوجيا": Laptop,
  "سياسة": Scale,
  "رياضة": Trophy,
  "مجتمع": Users,
  "صحة": Stethoscope,
  "علوم": Microscope,
  "ترفيه": Clapperboard,
  "تعليم": GraduationCap,
  "بيئة": Leaf,
  "موضة": Shirt,
  "أخرى": LayoutGrid,
  "اخرى": LayoutGrid,
  "عام": LayoutGrid,
};

const renderCategoryIcon = (cat, isActive) => {
  const key = (cat?.slug || cat?.name || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  const Icon = CATEGORY_ICONS[key] || LayoutGrid;
  return (
    <Icon
      className={`h-4 w-4 ${isActive ? "text-teal-700" : "text-gray-400"}`}
    />
  );
};

export default function UserSidebar({
  activeCategory = "all",
  onCategoryChange,
}) {
  const { data: categories = [] } = useCategories();
  const navigateToFeedWithCategory = useCategoryNavigation();
  const isPremium = useSelector(selectIsPremium);
  
  // Smart handler: if onCategoryChange is provided (Feed context), use it
  // Otherwise, navigate to /feed with the category
  const handleCategorySelect = (category) => {
    if (onCategoryChange) {
      onCategoryChange(category);
    } else {
      navigateToFeedWithCategory(category);
    }
  };

  return (
    <aside className="space-y-5 z-10 h-full">
      <ProfileCard />

      {/* Feeds */}
      <div className={`rounded-xl border border-gray-200 bg-white p-5 ${isPremium ? 'sticky top-[100px] z-20 shadow-sm' : ''}`}>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
          التصنيفات
        </h4>
        <nav className="space-y-1">
          {/* "All" option */}
          <button
            onClick={() => handleCategorySelect("all")}
            className={`w-full flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition cursor-pointer ${
              activeCategory === "all"
                ? "bg-teal-50 text-teal-800"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            كل المواضيع
          </button>
          {/* Dynamic categories from DB */}
          {categories.filter(cat => cat.slug !== 'economy' && cat.name !== 'اقتصاد').map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`w-full flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition cursor-pointer ${
                activeCategory === cat.slug
                  ? "bg-teal-50 text-teal-800"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {renderCategoryIcon(cat, activeCategory === cat.slug)}
              {cat.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Ad Placeholder for Sidebar */}
      {MOCK_ADS?.[0] && (
        <div className="hidden lg:block sticky top-[100px] z-20">
          <AdCard ad={MOCK_ADS[0]} variant="sidebar" />
        </div>
      )}
    </aside>
  );
}
