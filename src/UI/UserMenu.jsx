import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "../hooks/useAuth";
import { selectIsPremium } from "../store/authSlice";

export default function UserMenu() {
  const { profile, isAuthenticated } = useAuth();
  const isPremium = useSelector(selectIsPremium);

  const name = profile?.full_name || profile?.display_name || "مستخدم";
  const avatar = profile?.avatar_url || "/logo/Trendy-logo-no-text.png";
  const plan = isPremium ? "Trendy Premium" : "حساب مجاني";
  const profileLink = profile?.id ? `/profile/${profile.id}` : "/login";

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition"
      >
        تسجيل الدخول
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 cursor-pointer">
      <Link to={profileLink} className="flex items-center gap-3">
        <div className="text-start hidden sm:block">
          <p className="text-sm font-semibold text-gray-800 leading-tight">
            {name}
          </p>
          <p className="text-xs text-text-muted leading-tight">{plan}</p>
        </div>
        <img
          src={avatar || "/logo/Trendy-logo-no-text.png"}
          alt={name}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-400"
        />
      </Link>
    </div>
  );
}
