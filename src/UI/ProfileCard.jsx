import { Crown, LogOut, CheckCircle, ShieldAlert, User, ChevronLeft } from "lucide-react";
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
    <div className="group relative h-64 rounded-3xl overflow-hidden mb-5 cursor-pointer shadow-sm border border-gray-100">
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-linear-to-br ${isAdmin ? 'from-slate-700 to-slate-900' : 'from-teal-500 to-emerald-700'} opacity-90 transition-transform duration-700 group-hover:scale-105`} />
      
      {/* Decorative background shapes */}
      <div className="absolute inset-0 opacity-30 mix-blend-overlay">
        <div className="absolute top-10 -right-10 w-40 h-40 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-20 -left-10 w-40 h-40 rounded-full bg-black blur-3xl" />
      </div>

      {/* Bottom Dark Gradient Fade */}
      <div className="absolute inset-0 bg-linear-to-t from-gray-900/95 via-gray-900/40 to-transparent" />

      {/* Top Logout Button / User Icon */}
      {isAuthenticated ? (
        <button 
          onClick={handleLogout}
          className="absolute top-4 left-4 h-10 w-10 rounded-full backdrop-blur-md bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10 cursor-pointer"
          title="تسجيل الخروج"
        >
          <LogOut className="h-5 w-5" />
        </button>
      ) : (
        <div className="absolute top-4 left-4 h-10 w-10 rounded-full backdrop-blur-md bg-white/10 border border-white/20 flex items-center justify-center text-white z-10">
          <User className="h-5 w-5" />
        </div>
      )}

      {/* Content Wrapper */}
      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end z-10">
        
        {/* Role/Badge */}
        <p className="text-white/90 font-semibold text-sm mb-0.5">
          {isAdmin ? "مسؤول النظام" : (isPremium ? "عضو بريميوم" : "عضو تريندي")}
        </p>

        {/* Name */}
        <h3 className="text-white font-extrabold text-2xl mb-2 line-clamp-1 drop-shadow-md">
          {name}
        </h3>

        {/* Premium/Admin Status Info row */}
        <div className="flex items-center gap-3 text-white/90 text-xs font-semibold mb-6">
          {isAdmin ? (
            <div className="flex items-center gap-1.5 backdrop-blur-md bg-black/20 border border-white/10 px-2.5 py-1 rounded-full text-white">
              <ShieldAlert className="h-3 w-3" />
              <span>لوحة التحكم الكاملة</span>
            </div>
          ) : (
            isPremium ? (
              <div className="flex items-center gap-1.5 backdrop-blur-md bg-black/20 border border-white/10 px-2.5 py-1 rounded-full text-white">
                <CheckCircle className="h-3 w-3 fill-white text-emerald-500" />
                <span>اشتراك نشط</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 backdrop-blur-md bg-black/20 border border-white/10 px-2.5 py-1 rounded-full text-white">
                <Crown className="h-3 w-3 text-amber-400" />
                <span>ترقية الحساب متاحة</span>
              </div>
            )
          )}
        </div>

        {/* Main Action Button (CTA) */}
        {isAdmin ? (
          <Link 
            to="/admin"
            className="w-full flex items-center justify-between backdrop-blur-xl bg-white/10 rounded-[32px] p-1.5 shadow-lg border border-white/20 hover:bg-white/20 transition-colors cursor-pointer group/btn"
          >
            <span className="text-white text-[15px] font-semibold pr-4">
              لوحة التحكم
            </span>
            <div className="h-[42px] w-[42px] shrink-0 bg-white rounded-full flex items-center justify-center text-black">
              <ChevronLeft className="h-5 w-5" />
            </div>
          </Link>
        ) : (
          isAuthenticated ? (
            <button 
              onClick={() => isPremium ? navigate(`/profile/${profile?.id}`) : setPremiumOpen(true)}
              className="w-full flex items-center justify-between backdrop-blur-xl bg-white/10 rounded-[32px] p-1.5 shadow-lg border border-white/20 hover:bg-white/20 transition-colors cursor-pointer group/btn"
            >
              <span className="text-white text-[15px] font-semibold pr-4">
                {isPremium ? "زيارة الملف الشخصي" : "اشترك في بريميوم"}
              </span>
              <div className="h-[42px] w-[42px] shrink-0 bg-white rounded-full flex items-center justify-center text-black">
                <ChevronLeft className="h-5 w-5" />
              </div>
            </button>
          ) : (
            <Link 
              to="/login"
              className="w-full flex items-center justify-between backdrop-blur-xl bg-white/10 rounded-[32px] p-1.5 shadow-lg border border-white/20 hover:bg-white/20 transition-colors cursor-pointer group/btn"
            >
              <span className="text-white text-[15px] font-semibold pr-4">
                تسجيل الدخول
              </span>
              <div className="h-[42px] w-[42px] shrink-0 bg-white rounded-full flex items-center justify-center text-black">
                <ChevronLeft className="h-5 w-5" />
              </div>
            </Link>
          )
        )}
      </div>
      <PremiumModal isOpen={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </div>
  );
}
