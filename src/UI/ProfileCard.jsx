import { Crown, LogOut, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "../hooks/useAuth";
import { selectIsPremium } from "../store/authSlice";
import PremiumModal from "./PremiumModal";

export default function ProfileCard() {
  const { profile, isAuthenticated, logout } = useAuth();
  const isPremium = useSelector(selectIsPremium);
  const navigate = useNavigate();
  const [premiumOpen, setPremiumOpen] = useState(false);

  const name = profile?.full_name || profile?.display_name || "مستخدم";
  const avatar = profile?.avatar_url || "/logo/Trendy-logo-no-text.png";

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-5">
      {/* Gradient header */}
      <div className="h-20 lg:h-24 bg-linear-to-r from-teal-500 to-emerald-400" />

      {/* Avatar – overlaps the header */}
      <div className="flex justify-center -mt-10 lg:-mt-12">
        <img
          src={avatar}
          alt={name}
          className="h-20 w-20 lg:h-24 lg:w-24 rounded-full object-cover ring-4 ring-white shadow-lg"
        />
      </div>

      {/* Info */}
      <div className="px-4 lg:px-5 pt-3 pb-4 lg:pb-5 text-center">
        <Link
          to={profile?.id ? `/profile/${profile.id}` : "#"}
          className="text-base font-bold text-gray-900 mb-3.5 block hover:text-teal-600 transition"
        >
          {name}
        </Link>

        {/* Try Premium or Premium Badge */}
        {isPremium ? (
          <div className="mx-auto flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-teal-100 to-emerald-100 px-6 py-2.5 text-sm font-semibold text-teal-700 shadow-md mb-5">
            <CheckCircle className="h-4 w-4" />
            Trendy Premium
          </div>
        ) : (
          <button
            onClick={() => setPremiumOpen(true)}
            className="mx-auto flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-amber-400 to-orange-400 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition cursor-pointer mb-5"
          >
            <Crown className="h-4 w-4" />
            جرب البريميوم
          </button>
        )}

        {/* Log Out */}
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition w-full cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        )}
        {!isAuthenticated && (
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-sm text-teal-600 hover:text-teal-700 transition"
          >
            تسجيل الدخول
          </Link>
        )}
      </div>
      <PremiumModal isOpen={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </div>
  );
}
