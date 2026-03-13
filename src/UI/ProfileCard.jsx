import { Crown, LogOut, CheckCircle, ShieldAlert } from "lucide-react";
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
  const isAdmin = profile?.role === "ADMIN";

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-5">
      {/* Solid color header */}
      <div className="h-14 lg:h-16 bg-teal-600" />

      {/* Info */}
      <div className="px-4 lg:px-5 pt-3 pb-4 lg:pb-5 text-center">
        <div className="flex flex-col items-center mb-3.5">
          <Link
            to={profile?.id ? `/profile/${profile.id}` : "#"}
            className="text-base font-bold text-gray-900 hover:text-teal-600 transition"
          >
            {name}
          </Link>
          {isAdmin && (
            <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 rounded-full border border-teal-100 uppercase mt-1">
              Admin / مسؤول
            </span>
          )}
        </div>

        {/* Admin Dashboard Access */}
        {isAdmin && (
          <Link
            to="/admin"
            className="mx-auto flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-black text-white hover:transition cursor-pointer mb-3"
          >
            <ShieldAlert className="h-4 w-4" />
            لوحة تحكم المسؤول
          </Link>
        )}

        {/* Try Premium or Premium Badge (Only for non-admins to keep it clean) */}
        {!isAdmin && (
          isPremium ? (
            <div className="mx-auto flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-teal-100 to-emerald-100 px-6 py-2.5 text-sm font-semibold text-teal-700 mb-5">
              <CheckCircle className="h-4 w-4" />
              Trendy Premium
            </div>
          ) : (
            <button
              onClick={() => setPremiumOpen(true)}
              className="mx-auto flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-amber-400 to-orange-400 px-6 py-2.5 text-sm font-semibold text-white hover:transition cursor-pointer mb-5"
            >
              <Crown className="h-4 w-4" />
              جرب البريميوم
            </button>
          )
        )}

        {/* Log Out */}
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className={`flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition w-full cursor-pointer ${isAdmin ? 'mt-2' : ''}`}
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
