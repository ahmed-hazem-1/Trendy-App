import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { STATUS_CONFIG } from "./StatusBadge";

export default function TrendingSidebar({ trendingItems = [] }) {
  return (
    <aside className="sticky top-24 space-y-6 self-start">
      {/* Trending Now */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">الرائج الآن</h3>
          <TrendingUp className="h-5 w-5 text-teal-500" />
        </div>

        <div className="divide-y divide-gray-100">
          {trendingItems.slice(0, 5).map((item) => {
            const key =
              item.verification_status?.toUpperCase?.() || "UNVERIFIED";
            const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.UNVERIFIED;
            return (
              <Link
                to={`/posts/${item.id}`}
                key={item.id}
                className="block py-3.5 first:pt-0 last:pb-0 space-y-1.5 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition"
              >
                <p className="text-sm duration-200 hover:text-accent-emerald font-semibold text-gray-800 leading-snug line-clamp-2">
                  {item.title}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase ${cfg.text} ${cfg.bg} ${cfg.border} rounded-full px-2 py-0.5`}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {item.credibility_score}% ثقة
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {trendingItems.length > 5 && (
          <button className="mt-4 w-full text-center text-sm font-semibold text-red-500 hover:text-red-600 transition cursor-pointer">
            عرض المزيد
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="text-center space-y-1 px-2">
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
          <a href="#" className="hover:text-gray-600 transition">
            حول
          </a>
          <a href="#" className="hover:text-gray-600 transition">
            إمكانية الوصول
          </a>
          <a href="#" className="hover:text-gray-600 transition">
            مركز المساعدة
          </a>
          <a href="#" className="hover:text-gray-600 transition">
            الخصوصية والشروط
          </a>
        </div>
        <p className="text-[11px] text-gray-400">© 2026 Trendy AI</p>
      </div>
    </aside>
  );
}

function StatBox({ label, value, color, bg, border }) {
  return (
    <div className={`rounded-lg border ${border} ${bg} p-3 text-center`}>
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
