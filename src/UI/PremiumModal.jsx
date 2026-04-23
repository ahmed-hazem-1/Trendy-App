import { X, Crown, ShieldCheck, Zap, Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../hooks/useAuth";

const perks = [
  { icon: <ShieldCheck className="h-5 w-5" />, title: "تحقق أسرع", desc: "أولوية في تحليل الأخبار والتنبيهات الموثوقة" },
  { icon: <Zap className="h-5 w-5" />, title: "تحليلات متقدمة", desc: "مؤشرات موثوقية تفصيلية مع سياق أعمق" },
  { icon: <Bell className="h-5 w-5" />, title: "تنبيهات مخصصة", desc: "إشعارات فورية حسب اهتماماتك المفضلة" },
];

export default function PremiumModal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const [successMsg, setSuccessMsg] = useState("");
  const { upgradeToPremium, upgradeLoading, upgradeError, isPremium } = useAuth();

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
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  }

  async function handleSubscribe() {
    try {
      await upgradeToPremium();
      setSuccessMsg("تم تفعيل الاشتراك! استمتع بالمزايا الكاملة.");
      setTimeout(() => {
        onClose();
        setSuccessMsg("");
      }, 2000);
    } catch (err) {
      console.error("Upgrade failed:", err);
    }
  }

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center px-0 sm:px-4"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/50 transition-opacity duration-300 opacity-100" />

      <div
        ref={modalRef}
        className="relative w-full max-w-full sm:max-w-lg bg-gray-900 rounded-t-[2rem] sm:rounded-[2rem] border border-gray-800 overflow-hidden premium-modal-enter shadow-2xl"
      >
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-base sm:text-lg font-bold text-white">Trendy Premium</h3>
          <div className="w-8" />
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="relative overflow-hidden rounded-2xl bg-teal-600 text-white p-4 sm:p-5">
            <div className="absolute -top-10 -left-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 -right-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="relative flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Crown className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm sm:text-base font-semibold">مزايا حصرية</p>
                <p className="text-xs sm:text-sm text-white/90">وصول كامل دون إعلانات وتجربة أسرع في التحقق</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {perks.map((perk) => (
              <div
                key={perk.title}
                className="flex items-start gap-3 rounded-2xl border border-gray-800 bg-gray-800/50 px-4 py-3 sm:px-5 sm:py-4"
              >
                <div className="mt-0.5 text-teal-400">{perk.icon}</div>
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-semibold text-gray-100">{perk.title}</p>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-700 bg-gray-800 text-gray-300 px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-sm sm:text-base font-semibold text-teal-400">جربها مجاناً</p>
            <p className="text-xs sm:text-sm mt-1">استكشف المزايا ثم اختر الخطة المناسبة لك</p>
          </div>

          {upgradeError && (
            <div className="rounded-xl bg-red-900/50 border border-red-800 p-3 text-sm text-red-200">
              خطأ: {upgradeError?.message || "فشل تفعيل الاشتراك"}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-green-900/50 border border-green-800 p-3 text-sm text-green-200 text-center">
              ✓ {successMsg}
            </div>
          )}

          <div className="flex gap-3 sm:gap-4 pt-1">
            <button
              onClick={onClose}
              disabled={upgradeLoading}
              className="flex-1 h-11 sm:h-12 rounded-full border border-gray-700 bg-gray-800 text-gray-300 font-semibold hover:bg-gray-700 transition cursor-pointer disabled:opacity-50"
            >
              {isPremium ? "إغلاق" : "لاحقاً"}
            </button>
            {!isPremium && (
              <button
                onClick={handleSubscribe}
                disabled={upgradeLoading}
                className="group relative flex-1 h-11 sm:h-12 rounded-full bg-teal-600 text-white font-semibold transition cursor-pointer hover:bg-teal-500 active:scale-[0.99] overflow-hidden disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <span className="pointer-events-none absolute inset-0 bg-white/15 backdrop-blur-[1px] opacity-0 transition duration-200 group-hover:opacity-100" />
                <span className="relative">
                  {upgradeLoading ? "جاري التفعيل..." : "اشترك الآن"}
                </span>
              </button>
            )}
          </div>
        </div>
 


        <div className="h-[env(safe-area-inset-bottom,12px)] sm:h-0" />
      </div>
    </div>,
    document.body,
  );
}
