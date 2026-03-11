import { AlertTriangle, XCircle, CheckCircle, ShieldAlert } from "lucide-react";

const FILTERS = [
  { key: "ALL", label: "الكل", icon: null },
  { key: "VERIFIED", label: "متحقق", icon: CheckCircle },
  { key: "UNVERIFIED", label: "غير متحقق", icon: AlertTriangle },
  { key: "MISLEADING", label: "مضلل", icon: ShieldAlert },
  { key: "FAKE", label: "مزيف", icon: XCircle },
];

export default function FilterTabs({ active = "ALL", onChange }) {
  return (
    <div className="mb-4 sm:mb-6">
      {/* Section Title - Mobile Only */}
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 lg:hidden">
        حالة التحقق
      </h3>
      
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-2 rounded-xl border-2 px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-all cursor-pointer shadow-sm whitespace-nowrap shrink-0 ${
              active === key
                ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-teal-500 shadow-lg scale-105"
                : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:bg-teal-50/30"
            }`}
          >
            {label}
            {Icon && <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />}
          </button>
        ))}
      </div>
    </div>
  );
}
