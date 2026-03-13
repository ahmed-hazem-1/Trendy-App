import { LayoutGrid } from "lucide-react";

import ProfileCard from "../../UI/ProfileCard";
import { useCategories } from "../../hooks/useNews";

const HASH = <span className="text-sm font-semibold">#</span>;

export default function UserSidebar({
  activeCategory = "all",
  onCategoryChange,
}) {
  const { data: categories = [] } = useCategories();

  return (
    <aside className="">
      <ProfileCard />

      {/* Feeds */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
          التصنيفات
        </h4>
        <nav className="space-y-1">
          {/* "All" option */}
          <button
            onClick={() => onCategoryChange?.("all")}
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
              onClick={() => onCategoryChange?.(cat.slug)}
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
    </aside>
  );
}
