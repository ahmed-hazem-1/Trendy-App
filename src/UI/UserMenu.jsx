import {
  ChevronDown,
  User,
  Bookmark,
  Crown,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "../hooks/useAuth";
import { selectIsPremium, selectIsDemoMode } from "../store/authSlice";
import PremiumModal from "./PremiumModal";

function getInitial(name) {
  if (!name || typeof name !== "string") return "T";
  return name.trim().charAt(0).toUpperCase() || "T";
}

function getAccountState({ isDemoMode, isPremium, profile }) {
  if (isDemoMode) {
    return {
      label: "وضع التجربة",
      style: "bg-amber-50 text-amber-700 border border-amber-200",
    };
  }

  const premiumSubscription = (profile?.user_subscriptions || []).find(
    (sub) =>
      (sub.status === "ACTIVE" || sub.status === "TRIAL") &&
      sub.subscription_plans?.slug === "premium",
  );

  if (premiumSubscription?.status === "TRIAL") {
    return {
      label: "تجربة بريميوم",
      style: "bg-teal-50 text-teal-700 border border-teal-200",
    };
  }

  if (isPremium) {
    return {
      label: "Trendy Premium",
      style: "bg-teal-50 text-teal-700 border border-teal-200",
    };
  }

  return {
    label: "حساب مجاني",
    style: "bg-gray-100 text-gray-600 border border-gray-200",
  };
}

function MenuItemLink({ to, icon, title, subtitle, onClick }) {
  const IconComponent = icon;

  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-50 transition"
    >
      <div className="rounded-lg bg-gray-100 p-1.5 text-gray-500">
        <IconComponent className="h-4 w-4" />
      </div>
      <div className="text-start leading-tight min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
        {subtitle ? <p className="text-xs text-gray-400 truncate">{subtitle}</p> : null}
      </div>
    </Link>
  );
}

export default function UserMenu() {
  const { profile, isAuthenticated, logout, logoutLoading } = useAuth();
  const isPremium = useSelector(selectIsPremium);
  const isDemoMode = useSelector(selectIsDemoMode);

  const [menuOpen, setMenuOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);

  const menuRef = useRef(null);

  const displayName = isDemoMode
    ? "زائر"
    : profile?.full_name || profile?.display_name || "مستخدم";
  const profileLink = profile?.id ? `/profile/${profile.id}` : "/login";
  const accountState = useMemo(
    () => getAccountState({ isDemoMode, isPremium, profile }),
    [isDemoMode, isPremium, profile],
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
      setMenuOpen(false);
    } catch {
      // Keep the menu open so the user can retry logout.
    }
  }

  if (!isAuthenticated && !isDemoMode) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/login"
          className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((value) => !value)}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1.5 sm:px-3 sm:py-2 hover:border-teal-200 hover:bg-teal-50/30 transition cursor-pointer"
          aria-label="قائمة الحساب"
        >
          <div className="relative h-9 w-9 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 text-white flex items-center justify-center text-sm font-bold">
            {getInitial(displayName)}
            {isPremium && !isDemoMode ? (
              <span className="absolute -top-1 -left-1 rounded-full bg-amber-400 p-0.5 text-amber-900 border border-white">
                <Crown className="h-2.5 w-2.5" />
              </span>
            ) : null}
          </div>

          <div className="hidden sm:block text-start leading-tight min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate max-w-[130px]">
              {displayName}
            </p>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold mt-0.5 ${accountState.style}`}
            >
              {accountState.label}
            </span>
          </div>

          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {menuOpen ? (
          <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold mt-1 ${accountState.style}`}
              >
                {accountState.label}
              </span>
            </div>

            <div className="p-2 space-y-1">
              {isAuthenticated ? (
                <>
                  <MenuItemLink
                    to={profileLink}
                    icon={User}
                    title="الملف الشخصي"
                    subtitle="تعديل بياناتك واهتماماتك"
                    onClick={() => setMenuOpen(false)}
                  />

                  <MenuItemLink
                    to="/saved"
                    icon={Bookmark}
                    title="المحفوظات"
                    subtitle="الأخبار التي حفظتها لاحقاً"
                    onClick={() => setMenuOpen(false)}
                  />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setPremiumOpen(true);
                    }}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-teal-50 transition cursor-pointer"
                  >
                    <div className="rounded-lg bg-teal-50 p-1.5 text-teal-600 border border-teal-100">
                      <Crown className="h-4 w-4" />
                    </div>
                    <div className="text-start leading-tight min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {isPremium ? "حالة البريميوم" : "الترقية إلى البريميوم"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {isPremium
                          ? "أنت مشترك حالياً في Trendy Premium"
                          : "مزايا إضافية وتحليلات أعمق بدون إعلانات"}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-red-50 transition cursor-pointer disabled:opacity-60"
                  >
                    <div className="rounded-lg bg-red-50 p-1.5 text-red-600 border border-red-100">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <div className="text-start leading-tight min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {logoutLoading ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        إنهاء الجلسة الحالية بأمان
                      </p>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <MenuItemLink
                    to="/login"
                    icon={LogIn}
                    title="تسجيل الدخول"
                    subtitle="استكمال التجربة بحسابك"
                    onClick={() => setMenuOpen(false)}
                  />

                  <MenuItemLink
                    to="/signup"
                    icon={UserPlus}
                    title="إنشاء حساب"
                    subtitle="احفظ تفضيلاتك وتفاعلاتك"
                    onClick={() => setMenuOpen(false)}
                  />
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <PremiumModal isOpen={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </>
  );
}
