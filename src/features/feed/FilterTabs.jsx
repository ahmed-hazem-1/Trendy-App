import { AlertTriangle, XCircle, CheckCircle, ShieldAlert } from "lucide-react";

const FILTERS = [
  { key: "ALL", label: "الكل", icon: null },
  { key: "VERIFIED", label: "متحقق", icon: CheckCircle },
  { key: "UNVERIFIED", label: "غير متحقق", icon: AlertTriangle },
  { key: "FAKE", label: "مزيف", icon: XCircle },
];

export default function FilterTabs({ active = "ALL", onChange }) {
  return (
    <div className="mb-4 sm:mb-6">
      {/* Section Title - Mobile Only */}
      <h3 className="text-[10px] font-bold text-teal-600/80 uppercase tracking-widest mb-2.5 lg:hidden px-1">
        حالة التحقق
      </h3>
      
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-2 rounded-full border px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-bold transition-all transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
              active === key
                ? "bg-teal-600 text-white border-teal-500 shadow-lg shadow-teal-600/20"
                : "bg-gray-900 text-gray-300 border-gray-800 hover:border-gray-700 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <span className="relative z-10">{label}</span>
            {Icon && (
              <Icon className={`h-4 w-4 sm:h-4.5 sm:w-4.5 relative z-10 transition-colors ${active === key ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
