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
    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1">
      {FILTERS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition cursor-pointer shadow whitespace-nowrap shrink-0 ${
            active === key
              ? "bg-gray-800 text-white border-gray-800"
              : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
          }`}
        >
          {label}
          {Icon && <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
        </button>
      ))}
    </div>
  );
}
