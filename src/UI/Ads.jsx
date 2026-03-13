import { ExternalLink, Crown } from "lucide-react";
import { useSelector } from "react-redux";
import { selectIsPremium } from "../store/authSlice";
import { MOCK_ADS } from "../utils/adsData";

/* ─── Enhanced Ad Card ─── */
export function AdCard({ ad, variant = "sidebar" }) {
  const Icon = ad.icon;
  const isHorizontal = variant === "horizontal";

  return (
    <div
      className={`group relative rounded-2xl border border-gray-100 bg-white overflow-hidden transition-all duration-300 hover:hover:-translate-y-0.5 ${
        isHorizontal ? "flex items-stretch" : "flex flex-col h-55"
      }`}
    >
      {/* Gradient header / side strip */}
      <div
        className={`bg-linear-to-r ${ad.gradient} relative ${
          isHorizontal
            ? "w-2 shrink-0 rounded-s-2xl"
            : "h-20 flex items-center justify-center"
        }`}
      >
        {!isHorizontal && (
          <>
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-15">
              <div className="absolute top-2 right-4 w-12 h-12 rounded-full border-2 border-white/40" />
              <div className="absolute bottom-1 left-6 w-8 h-8 rounded-full border-2 border-white/30" />
              <div className="absolute top-4 left-12 w-5 h-5 rounded-full bg-white/20" />
            </div>
            {/* Floating icon */}
            <div className="relative z-10 w-12 h-12 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center">
              <Icon className="h-6 w-6 text-white" />
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div
        className={`p-4 flex flex-col ${isHorizontal ? "flex-1 py-3" : "flex-1"}`}
      >
        {/* Badge — reserve space even when empty for uniform height */}
        <div className={`${isHorizontal ? "" : "h-5 mb-0.5"}`}>
          {ad.badge && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ad.badgeColor}`}
            >
              {ad.badge}
            </span>
          )}
        </div>

        <div className={`${isHorizontal ? "flex items-center gap-2" : ""}`}>
          {isHorizontal && (
            <div
              className={`w-9 h-9 shrink-0 rounded-lg ${ad.iconBg} flex items-center justify-center`}
            >
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-0.5">
              {ad.title}
            </h4>
            <p
              className={`text-xs text-gray-500 leading-relaxed ${isHorizontal ? "line-clamp-1" : "mb-3"}`}
            >
              {ad.description}
            </p>
          </div>
        </div>

        {/* CTA button */}
        <button
          className={`mt-auto w-full text-center rounded-xl bg-linear-to-r ${ad.gradient} px-4 py-2 text-xs font-semibold text-white ${ad.ctaHover} hover:transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
            isHorizontal ? "mt-2" : "mt-0"
          }`}
        >
          {ad.cta}
          <ExternalLink className="h-3 w-3 opacity-70" />
        </button>
      </div>

      {/* Sponsored label */}
      <div
        className={`absolute ${isHorizontal ? "top-1.5 left-2" : "bottom-1 left-0 right-0 text-center"}`}
      >
        <p className="text-[9px] text-gray-300 font-medium">إعلان مموّل</p>
      </div>
    </div>
  );
}

/* ─── Premium Banner Ad (for mobile / tablet) ─── */
export function PremiumBanner() {
  const isPremium = useSelector(selectIsPremium);

  // Don't show banner if user is already premium
  if (isPremium) return null;

  return (
    <div className="lg:hidden mb-4 rounded-2xl bg-linear-to-r from-teal-600 to-emerald-500 p-4 text-white relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/10" />

      <div className="relative flex items-center gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Crown className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold">Trendy Premium</h4>
          <p className="text-xs text-white/80 line-clamp-1">
            تحليلات متقدمة • تحقق أسرع • بدون إعلانات
          </p>
        </div>
        <button className="shrink-0 bg-white text-teal-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-teal-50 transition cursor-pointer">
          جرّب
        </button>
      </div>
    </div>
  );
}

/* ─── Mobile / Tablet Ad Strip ─── */
export function MobileAdStrip() {
  const isPremium = useSelector(selectIsPremium);

  // Don't show ads if user is premium
  if (isPremium) return null;

  return (
    <div className="lg:hidden mt-6 space-y-4">
      {/* Section divider */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold text-gray-400 px-2">
          قد يعجبك أيضاً
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* 2-col grid on sm+ */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-3">
        {MOCK_ADS.map((ad) => (
          <AdCard key={ad.id} ad={ad} variant="horizontal" />
        ))}
      </div>

      {/* Horizontal scroll on tiny screens */}
      <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
        {MOCK_ADS.map((ad) => (
          <div key={ad.id} className="w-64 shrink-0 snap-start">
            <AdCard ad={ad} variant="sidebar" />
          </div>
        ))}
      </div>
    </div>
  );
}
