import { useForm, Controller } from "react-hook-form";
import {
  LayoutGrid,
  User,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Save,
  X,
  Camera,
  Heart,
  Bookmark,
  Trash2,
  ExternalLink,
  Laptop,
  Scale,
  Trophy,
  Users,
  LineChart,
  Stethoscope,
  Microscope,
  Clapperboard,
  GraduationCap,
  Leaf,
  Crown,
  Shirt,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import FormInput from "../UI/FormInput";
import FormSelect from "../UI/FormSelect";
import Button from "../UI/Button";
import MobileSidebar from "../UI/MobileSidebar";
import { EGYPT_GOVERNORATES } from "../utils/constants";
import { AdCard, PremiumBanner, FeedAdStrip } from "../UI/Ads";
import PremiumModal from "../UI/PremiumModal";
import { MOCK_ADS } from "../utils/adsData";
import { useAuth } from "../hooks/useAuth";
import { updateUserProfile } from "../api/authApi";
import {
  useCategories,
  useUserBookmarks,
  useToggleBookmark,
} from "../hooks/useNews";
import StatusBadge from "../features/feed/StatusBadge";
import { Link } from "react-router-dom";
import { selectIsPremium } from "../store/authSlice";

// Shared icon mapping
const CATEGORY_ICONS = {
  // English slugs
  technology: Laptop,
  tech: Laptop,
  politics: Scale,
  sports: Trophy,
  social: Users,
  health: Stethoscope,
  science: Microscope,
  entertainment: Clapperboard,
  education: GraduationCap,
  environment: Leaf,
  fashion: Shirt,
  other: LayoutGrid,
  general: LayoutGrid,

  // Arabic names/slugs
  "تكنولوجيا": Laptop,
  "سياسة": Scale,
  "رياضة": Trophy,
  "مجتمع": Users,
  "صحة": Stethoscope,
  "علوم": Microscope,
  "ترفيه": Clapperboard,
  "تعليم": GraduationCap,
  "بيئة": Leaf,
  "موضة": Shirt,
  "أخرى": LayoutGrid,
  "اخرى": LayoutGrid,
  "عام": LayoutGrid,
};

const renderCategoryIcon = (cat) => {
  const key = (cat?.slug || cat?.name || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  return CATEGORY_ICONS[key] || LayoutGrid;
};

// Mock user data — replace with real data from Supabase
const FALLBACK_USER = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  bio: "",
  interests: [],
  avatar: "/logo/Trendy-logo-no-text.png",
};

const PROFILE_TABS = [
  { key: "overview", label: "نظرة عامة", icon: LayoutGrid },
  { key: "personal-info", label: "المعلومات الشخصية", icon: User },
  { key: "interests", label: "الاهتمامات", icon: Heart },
  { key: "saved-posts", label: "الأخبار المحفوظة", icon: Bookmark },
  { key: "premium", label: "البريميوم", icon: Crown },
];

function ProfileTabNav({ activeTab, onTabChange, vertical = false }) {
  return (
    <nav
      className={
        vertical
          ? "space-y-2"
          : "flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin"
      }
    >
      {PROFILE_TABS.map(({ key, label, icon: Icon }) => {
        const active = activeTab === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              vertical
                ? `w-full justify-start border ${
                    active
                      ? "border-teal-200 bg-teal-50 text-teal-800"
                      : "border-transparent text-gray-600 hover:bg-gray-50"
                  }`
                : `${
                    active
                      ? "bg-teal-600 text-white shadow-sm"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-teal-200 hover:bg-teal-50/40"
                  }`
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function Profile() {
  const { sidebarOpen, closeSidebar } = useOutletContext();
  const { profile, refreshProfile, cancelSubscription, cancelLoading, cancelError } = useAuth();
  const isPremium = useSelector(selectIsPremium);
  const { data: bookmarks = [], isLoading: bookmarksLoading } = useUserBookmarks();
  const toggleBookmarkMutation = useToggleBookmark();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("all");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);

  const { data: categories = [] } = useCategories();

  // Derive user data from profile (Supabase public.users row)
  const userData = profile
    ? {
        fullName: profile.full_name || profile.display_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        bio: profile.bio || "",
        interests: profile.interests || [],
        avatar: profile.avatar_url || "/logo/Trendy-logo-no-text.png",
      }
    : FALLBACK_USER;

  const [interests, setInterests] = useState(userData.interests);
  const [bio, setBio] = useState(userData.bio);
  const [editingBio, setEditingBio] = useState(false);
  const [isSavingInterests, setIsSavingInterests] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: userData.fullName,
      email: userData.email,
      phone: userData.phone,
      location: userData.location,
    },
  });

  // Sync form defaults when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.full_name || profile.display_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
      });
      setBio(profile.bio || "");
      setInterests(profile.interests || []);
    }
  }, [profile, reset]);

  async function onSubmit(data) {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      await updateUserProfile(profile.id, {
        full_name: data.fullName,
        display_name: data.fullName,
        email: data.email,
        phone: data.phone,
        location: data.location,
      });
      await refreshProfile();
      setIsEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    reset();
    setIsEditing(false);
  }

  function toggleInterest(key) {
    setInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function handleInterestsSave() {
    if (!profile?.id) return;
    setIsSavingInterests(true);
    try {
      const validInterestsToSave = interests.filter(id => categories.some(cat => cat.slug === id));
      await updateUserProfile(profile.id, { interests: validInterestsToSave });
      await refreshProfile();
    } catch (err) {
      console.error("Interests update error:", err);
      alert("حدث خطأ أثناء حفظ الاهتمامات: " + err.message);
    } finally {
      setIsSavingInterests(false);
    }
  }

  async function handleBioSave() {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      await updateUserProfile(profile.id, { bio });
      await refreshProfile();
      setEditingBio(false);
    } catch (err) {
      console.error("Bio update error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleRemoveBookmark(newsItemId) {
    if (!profile?.id) return;
    toggleBookmarkMutation.mutate({
      newsItemId,
      userId: profile.id,
    });
  }

  const locationLabel =
    EGYPT_GOVERNORATES.find((g) => g.value === userData.location)?.label || "";

  const activeTab = searchParams.get("tab") || "overview";

  const premiumSubscription = (profile?.user_subscriptions || []).find(
    (subscription) =>
      (subscription.status === "ACTIVE" || subscription.status === "TRIAL") &&
      subscription.subscription_plans?.slug === "premium",
  );

  function handleTabChange(tabKey) {
    const next = new URLSearchParams(searchParams);
    if (tabKey === "overview") {
      next.delete("tab");
    } else {
      next.set("tab", tabKey);
    }
    setSearchParams(next, { replace: true });
  }

  function formatSubscriptionDate(dateValue) {
    if (!dateValue) return "—";
    return new Date(dateValue).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  async function handleCancelPremium() {
    if (!premiumSubscription?.id) return;
    const confirmed = window.confirm("هل تريد إلغاء الاشتراك البريميوم الآن؟");
    if (!confirmed) return;

    try {
      await cancelSubscription(premiumSubscription.id);
      await refreshProfile();
    } catch (err) {
      console.error("Cancel premium error:", err);
    }
  }

  return (
    <>
      <MobileSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <div 
        className={
          isPremium 
            ? "max-w-3xl mx-auto" 
            : "grid grid-cols-1 lg:grid-cols-[270px_1fr] xl:grid-cols-[270px_1fr_270px] gap-4 lg:gap-5 md:max-w-2xl lg:max-w-6xl mx-auto w-full"
        }
      >
        {/* Right ads sidebar — all 4 ads at lg, only first 2 at xl */}
        {!isPremium && (
          <aside className="hidden lg:block sticky top-24 self-start space-y-4">
            {/* First 2 ads — always visible at lg+ */}
            {MOCK_ADS.slice(0, 2).map((ad) => (
              <AdCard key={ad.id} ad={ad} variant="sidebar" />
            ))}
            {/* Last 2 ads — only in this sidebar at lg, hidden at xl (move to left sidebar) */}
            <div className="xl:hidden space-y-4">
              <div className="flex items-center gap-2 pt-1">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[10px] text-gray-300">المزيد</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              {MOCK_ADS.slice(2).map((ad) => (
                <AdCard key={ad.id} ad={ad} variant="sidebar" />
              ))}
            </div>
          </aside>
        )}

        {/* Main profile content */}
        <section className="min-w-0 space-y-5">
          {/* Premium banner on mobile */}
          <PremiumBanner onTryPremium={() => setPremiumOpen(true)} />
          
          {/* ── Profile Header Card (Revised: No Banner/Avatar) ── */}
          <div className="rounded-xl border border-gray-200 bg-linear-to-r from-teal-600 to-emerald-500 p-6 sm:p-8 text-white relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-[-20%] right-[-5%] w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-20%] left-[-5%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2 opacity-90 text-teal-50">
                <span className="text-lg sm:text-xl font-medium">مرحباً بك،</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3">
                {userData.fullName}
                <span className="text-3xl animate-bounce">👋</span>
              </h1>
              <div className="flex items-center gap-2 mt-4 text-sm sm:text-base text-teal-50 font-medium">
                <MapPin className="h-4 w-4" />
                <span>{locationLabel}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-5">
            <aside className="hidden lg:block sticky top-24 self-start">
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <ProfileTabNav
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  vertical
                />
              </div>
            </aside>

            <div className="min-w-0 space-y-5">
              <div className="lg:hidden rounded-xl border border-gray-200 bg-white p-2">
                <ProfileTabNav
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
              </div>

              {activeTab === "overview" && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-5 w-5 text-teal-600" />
                      <h2 className="text-base font-bold text-gray-900">
                        نظرة عامة
                      </h2>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isPremium
                          ? "bg-teal-50 text-teal-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isPremium ? "Premium نشط" : "حساب عادي"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs font-semibold text-gray-400 mb-1">
                        الاهتمامات
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                          {categories.length > 0 
                            ? interests.filter(id => categories.some(cat => cat.slug === id)).length 
                            : interests.length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs font-semibold text-gray-400 mb-1">
                        المحفوظات
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {bookmarks.length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs font-semibold text-gray-400 mb-1">
                        البريميوم
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {isPremium ? "نشط" : "غير مشترك"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

          {/* ── Interests Section ── */}
              {activeTab === "interests" && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center flex-row-reverse gap-2">
                <Heart className="h-5 w-5 text-teal-600" />
                <h2 className="text-lg font-bold text-gray-900">الاهتمامات</h2>
              </div>
              {interests !== userData.interests && (
                <button
                  onClick={handleInterestsSave}
                  disabled={isSavingInterests}
                  className="flex items-center gap-1.5 text-sm font-bold text-teal-600 hover:text-teal-700 transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSavingInterests ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-5">
              اختر المواضيع التي تهمك لتخصيص تجربتك في Trendy
            </p>
            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              {categories.filter(cat => cat.slug !== 'economy' && cat.name !== 'اقتصاد').map((category) => {
                const key = category.slug;
                const label = category.name;
                const Icon = renderCategoryIcon(key);
                const active = interests.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleInterest(key)}
                    className={`flex items-center gap-2 rounded-full border px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium transition-all cursor-pointer ${
                      active
                        ? "bg-teal-600 text-white border-teal-600 scale-105"
                        : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:bg-teal-50/10"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-white" : "text-gray-400"}`} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
              )}

              {activeTab === "personal-info" && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">
                المعلومات الشخصية
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 transition cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  تعديل
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 px-1">
                    الاسم الكامل
                  </label>
                  <FormInput
                    icon={User}
                    placeholder="الاسم الكامل"
                    error={errors.fullName}
                    register={register("fullName", {
                      required: "الاسم الكامل مطلوب",
                      minLength: {
                        value: 3,
                        message: "الاسم يجب أن يكون 3 أحرف على الأقل",
                      },
                    })}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 px-1">
                    البريد الإلكتروني
                  </label>
                  <FormInput
                    icon={Mail}
                    type="email"
                    placeholder="البريد الإلكتروني"
                    error={errors.email}
                    register={register("email", {
                      required: "البريد الإلكتروني مطلوب",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "أدخل بريد إلكتروني صحيح",
                      },
                    })}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 px-1">
                    رقم الهاتف
                  </label>
                  <FormInput
                    icon={Phone}
                    type="tel"
                    prefix="+20"
                    placeholder="1XXXXXXXXX"
                    error={errors.phone}
                    register={register("phone", {
                      required: "رقم الهاتف مطلوب",
                      pattern: {
                        value: /^1[0125]\d{8}$/,
                        message: "أدخل رقم هاتف مصري صحيح",
                      },
                    })}
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 px-1">
                    المحافظة
                  </label>
                  <Controller
                    name="location"
                    control={control}
                    rules={{ required: "الموقع مطلوب" }}
                    render={({ field: { value, onChange, name } }) => (
                      <FormSelect
                        icon={MapPin}
                        placeholder="اختر المحافظة"
                        options={EGYPT_GOVERNORATES}
                        error={errors.location}
                        name={name}
                        value={value}
                        onChange={onChange}
                      />
                    )}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    حفظ التغييرات
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancel}
                    className="cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    إلغاء
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <InfoRow icon={User} label="الاسم" value={userData.fullName} />
                <InfoRow
                  icon={Mail}
                  label="البريد الإلكتروني"
                  value={userData.email}
                />
                <InfoRow
                  icon={Phone}
                  label="رقم الهاتف"
                  value={userData.phone ? `+20${userData.phone}` : "—"}
                  dir="ltr"
                />
                <InfoRow icon={MapPin} label="المحافظة" value={locationLabel} />
              </div>
            )}
          </div>

              )}

              {activeTab === "premium" && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-amber-500" />
                      <h2 className="text-lg font-bold text-gray-900">
                        البريميوم
                      </h2>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isPremium
                          ? "bg-teal-50 text-teal-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isPremium ? "Premium نشط" : "غير مشترك"}
                    </span>
                  </div>

                  {premiumSubscription ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {premiumSubscription.subscription_plans?.name ||
                                "Trendy Premium"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {premiumSubscription.subscription_plans?.slug ||
                                "premium"}
                            </p>
                          </div>
                          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
                            {premiumSubscription.status === "TRIAL"
                              ? "تجربة"
                              : "نشط"}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 text-sm">
                          <div className="rounded-lg bg-white border border-gray-100 p-3">
                            <p className="text-xs text-gray-400 mb-1">
                              تاريخ البدء
                            </p>
                            <p className="font-medium text-gray-800">
                              {formatSubscriptionDate(
                                premiumSubscription.started_at,
                              )}
                            </p>
                          </div>
                          <div className="rounded-lg bg-white border border-gray-100 p-3">
                            <p className="text-xs text-gray-400 mb-1">
                              نهاية التجربة
                            </p>
                            <p className="font-medium text-gray-800">
                              {formatSubscriptionDate(
                                premiumSubscription.trial_ends_at ||
                                  premiumSubscription.expires_at,
                              )}
                            </p>
                          </div>
                          <div className="rounded-lg bg-white border border-gray-100 p-3">
                            <p className="text-xs text-gray-400 mb-1">
                              تاريخ الإلغاء
                            </p>
                            <p className="font-medium text-gray-800">
                              {formatSubscriptionDate(
                                premiumSubscription.cancelled_at,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="button"
                          onClick={() => setPremiumOpen(true)}
                          className="cursor-pointer"
                        >
                          <Crown className="h-4 w-4" />
                          فتح مزايا البريميوم
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleCancelPremium}
                          disabled={cancelLoading}
                          className="cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                          {cancelLoading ? "جارٍ الإلغاء..." : "إلغاء البريميوم"}
                        </Button>
                      </div>

                      {cancelError?.message && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                          {cancelError.message}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-amber-600" />
                        <p className="text-sm font-semibold text-amber-900">
                          جرّب Trendy Premium
                        </p>
                      </div>
                      <p className="text-sm text-amber-800">
                        فعّل البريميوم للوصول إلى المصادر والأدلة والتحليلات
                        المتقدمة بدون إعلانات.
                      </p>
                      <Button
                        type="button"
                        onClick={() => setPremiumOpen(true)}
                        className="cursor-pointer"
                      >
                        <Crown className="h-4 w-4" />
                        جرّب البريميوم
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "saved-posts" && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-teal-500" />
                <Link to="/saved" className="hover:text-teal-600 transition">
                  <h2 className="text-base font-bold text-gray-900">الأخبار المحفوظة</h2>
                </Link>
                {bookmarks.length > 0 && (
                  <span className="text-xs text-gray-500">({bookmarks.length})</span>
                )}
              </div>
              {bookmarks.length > 3 && (
                <Link
                  to="/saved"
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 transition"
                >
                  عرض الكل ←
                </Link>
              )}
            </div>

            {bookmarksLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-teal-600"></div>
                <p className="text-sm text-gray-500 mt-2">جارٍ التحميل...</p>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">لا توجد أخبار محفوظة</p>
                <p className="text-xs text-gray-400 mt-1">
                  احفظ الأخبار المهمة للرجوع إليها لاحقاً
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookmarks.slice(0, 3).map((bookmark) => {
                  const newsItem = bookmark.news_items;
                  if (!newsItem) return null;
                  
                  const category = newsItem.news_categories?.[0]?.categories?.name || "عام";
                  const savedDate = new Date(bookmark.saved_at).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <div
                      key={bookmark.id}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-3 hover:bg-gray-100 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status={newsItem.verification_status} />
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-teal-600 font-medium">
                              {category}
                            </span>
                          </div>
                          <Link
                            to={`/posts/${newsItem.id}`}
                            className="block group"
                          >
                            <h3 className="text-sm font-semibold text-gray-800 group-hover:text-teal-600 transition line-clamp-2 mb-1">
                              {newsItem.title}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400">
                              حُفظ في {savedDate}
                            </span>
                            {bookmark.note && (
                              <>
                                <span className="text-xs text-gray-300">•</span>
                                <span className="text-xs text-gray-500 italic line-clamp-1">
                                  {bookmark.note}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            to={`/posts/${newsItem.id}`}
                            className="p-2 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-white transition"
                            title="عرض الخبر"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleRemoveBookmark(newsItem.id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white transition"
                            title="إزالة من المحفوظات"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
              )}

          {/* Desktop/Tablet/Mobile ads — shown below the profile content */}
          <FeedAdStrip />
            </div>
          </div>
        </section>

        {/* Left ads sidebar — visible xl only (last 2 ads) */}
        {!isPremium && (
          <aside className="hidden xl:block sticky top-24 self-start space-y-4">
            {MOCK_ADS.slice(2).map((ad) => (
              <AdCard key={ad.id} ad={ad} variant="sidebar" />
            ))}
          </aside>
        )}
      </div>
      <PremiumModal isOpen={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </>
  );
}

function InfoRow({ icon, label, value, dir }) {
  const Icon = icon;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p
          className={`text-sm font-medium text-gray-800 truncate ${dir === "ltr" ? "text-left" : ""}`}
          dir={dir}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
