import { ExternalLink, Crown, Heart, ChevronLeft, Star } from "lucide-react";
import { useSelector } from "react-redux";
import { selectIsPremium } from "../store/authSlice";
import { MOCK_ADS } from "../utils/adsData";

/* ─── Enhanced Ad Card ─── */
export function AdCard({ ad, variant = "sidebar" }) {
  const isPremium = useSelector(selectIsPremium);
  const Icon = ad.icon;
  const isHorizontal = variant === "horizontal";

  // Hide all ads for premium users
  if (isPremium) return null;

  // Use the immersive card design for the regular "sidebar" or feed variant.
  if (!isHorizontal) {
    return (
      <div className="group relative h-60 rounded-3xl overflow-hidden cursor-pointer">
        {/* Background Gradient (simulating an image) */}
        <div className={`absolute inset-0 bg-linear-to-br ${ad.gradient} opacity-90 transition-transform duration-700 group-hover:scale-105`} />
        
        {/* Decorative background shapes to make the gradient look like a landscape/image */}
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <div className="absolute top-10 -right-10 w-40 h-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 -left-10 w-40 h-40 rounded-full bg-black blur-3xl" />
          {/* Subtle noise/texture would be nice, but simple circles work for gradient depth */}
        </div>

        {/* Bottom Dark Gradient Fade for Text Readability */}
        <div className="absolute inset-0 bg-linear-to-t from-gray-900/95 via-gray-900/40 to-transparent" />

        {/* Top left Heart Button (RTL makes left side standard for this) */}
        <button className="absolute top-4 left-4 h-10 w-10 rounded-full backdrop-blur-md bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10 cursor-pointer">
          <Heart className="h-5 w-5" />
        </button>

        {/* Content Wrapper */}
        <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end z-10 pointer-events-none">
          
          {/* Tag/Badge (Like "Brazil") */}
          <p className="text-white/90 font-semibold text-sm mb-0.5">
            {ad.badge || "إعلان مموّل"}
          </p>

          {/* Title (Like "Rio de Janeiro") */}
          <h3 className="text-white font-extrabold text-2xl mb-2 line-clamp-1 drop-shadow-md">
            {ad.title}
          </h3>

          {/* Ratings & Description row */}
          <div className="flex items-center gap-3 text-white/90 text-xs font-semibold mb-6">
            <div className="flex items-center gap-1 backdrop-blur-md bg-black/20 border border-white/10 px-2.5 py-1 rounded-full">
              <Star className="h-3 w-3 fill-white text-white drop-shadow-sm" />
              <span>5.0</span>
            </div>
            <span className="line-clamp-1 drop-shadow-md">{ad.description}</span>
          </div>

          {/* CTA Pill Button (Like "See more") */}
          <button className="w-full flex items-center justify-between backdrop-blur-xl bg-white/10 rounded-[32px] p-1.5 shadow-lg border border-white/20 pointer-events-auto hover:bg-white/20 transition-colors cursor-pointer group-hover:bg-white/20">
            <span className="text-white text-[15px] font-semibold pr-4">
              {ad.cta}
            </span>
            <div className="h-[42px] w-[42px] shrink-0 bg-white rounded-full flex items-center justify-center text-black">
              <ChevronLeft className="h-5 w-5" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Horizontal variant (for very small screens or specific placements)
  return (
    <div
      className="group relative rounded-2xl border border-gray-100 bg-white overflow-hidden transition-all duration-300 hover:-translate-y-0.5 flex items-stretch"
    >
      {/* Gradient side strip */}
      <div className={`bg-linear-to-r ${ad.gradient} relative w-2 shrink-0 rounded-s-2xl`} />

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 py-3">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 shrink-0 rounded-lg ${ad.iconBg} flex items-center justify-center`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-0.5">
              {ad.title}
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-1">
              {ad.description}
            </p>
          </div>
        </div>

        {/* CTA button */}
        <button
          className={`mt-2 w-full text-center rounded-full bg-linear-to-r ${ad.gradient} px-4 py-2 text-xs font-semibold text-white ${ad.ctaHover} hover:transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5`}
        >
          {ad.cta}
          <ExternalLink className="h-3 w-3 opacity-70" />
        </button>
      </div>

      <div className="absolute top-1.5 left-2">
        <p className="text-[9px] text-gray-300 font-medium">إعلان مموّل</p>
      </div>
    </div>
  );
}

/* ─── Premium Banner Ad (for mobile / tablet) ─── */
export function PremiumBanner({ onTryPremium }) {
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
        <button
          onClick={() => onTryPremium?.()}
          className="shrink-0 bg-white text-teal-700 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-teal-50 transition cursor-pointer"
        >
          جرّب
        </button>
      </div>
    </div>
  );
}

/* ─── Feed Ad Strip (Desktop & Mobile) ─── */
export function FeedAdStrip() {
  const isPremium = useSelector(selectIsPremium);

  // Don't show ads if user is premium
  if (isPremium) return null;

  return (
    <div className="mt-6 space-y-4">
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
