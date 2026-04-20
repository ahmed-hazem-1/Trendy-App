import { useState } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowRight,
  Loader,
  Sparkles,
  Share2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Tag,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Lock,
  Heart,
  Meh,
  Smile,
  ChevronDown,
} from "lucide-react";
import StatusBadge from "../features/feed/StatusBadge";
import ShareModal from "../features/feed/ShareModal";
import { buildPostShareUrl } from "../features/feed/shareUtils";
import MobileSidebar from "../UI/MobileSidebar";
import UserSidebar from "../features/feed/UserSidebar";
import { AdCard, PremiumBanner, FeedAdStrip } from "../UI/Ads";
import PremiumModal from "../UI/PremiumModal";
import { MOCK_ADS } from "../utils/adsData";
import {
  useNewsItem,
  useReactionCounts,
  useUserReaction,
  useReactToNews,
  useRemoveReaction,
  useEvidenceItems,
} from "../hooks/useNews";
import { selectProfile, selectIsDemoMode, selectIsPremium } from "../store/authSlice";
import {
  resolvePostImageView,
  POST_MEDIA_FRAME_PRESETS,
  POST_MEDIA_IMAGE_CLASS,
  PostImagePreviewModal,
} from "../postMedia";

// ─── helpers ────────────────────────────────

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapNewsItem(item) {
  const categoryMeta =
    item.categories || item.news_categories?.[0]?.categories || null;
  const category = categoryMeta?.name || "عام";
  const categorySlug = categoryMeta?.slug || null;
  const verdict = Array.isArray(item.verdicts)
    ? (item.verdicts[0] ?? null)
    : (item.verdicts ?? null);
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    url: item.url,
    verification_status:
      verdict?.verdict || item.verification_status || "UNVERIFIED",
    credibility_score: verdict?.confidence ?? item.credibility_score ?? 0,
    reasoning: verdict?.reasoning || null,
    sources_used: verdict?.sources_used || null,
    timeAgo: formatTimeAgo(item.ingested_at || item.published_at),
    publishedAt: formatDate(item.published_at || item.ingested_at),
    verificationNumber: item.verification_number ?? 0,
    category,
    categorySlug,
    imageUrl: item.image_url || null,
    evidence: item.evidence_items || [],
    verificationLog: item.verification_log || [],
    source: item.ingestion_sources || null,
  };
}

const REACTION_CONFIG = [
  {
    type: "SKEPTICAL", // Mapped to DB constraint
    emoji: "😲",
    Icon: Smile,
    label: "مفاجأ",
  },
  {
    type: "EXCITED", // Mapped to DB constraint
    emoji: "❤️",
    Icon: Heart,
    label: "أحببت",
  },
  {
    type: "NEUTRAL",
    emoji: "😐",
    Icon: Meh,
    label: "محايد",
  },
];

const REACTION_META = {
  EXCITED: { emoji: "❤️", label: "أحببت" },
  NEUTRAL: { emoji: "😐", label: "محايد" },
  SKEPTICAL: { emoji: "😲", label: "مفاجأ" },
  ANGRY: { emoji: "😡", label: "غاضب" },
};

const CONFIDENCE_COLORS = {
  high: { bar: "bg-green-500", text: "text-green-700", label: "ثقة عالية" },
  medium: {
    bar: "bg-amber-500",
    text: "text-amber-700",
    label: "ثقة متوسطة",
  },
  low: { bar: "bg-red-500", text: "text-red-700", label: "ثقة منخفضة" },
};

function getConfidenceLevel(score) {
  if (score >= 70) return CONFIDENCE_COLORS.high;
  if (score >= 40) return CONFIDENCE_COLORS.medium;
  return CONFIDENCE_COLORS.low;
}

const VERDICT_ICON = {
  TRUE: CheckCircle2,
  VERIFIED: CheckCircle2,
  FALSE: XCircle,
  FAKE: XCircle,
  MISLEADING: AlertTriangle,
  UNVERIFIED: HelpCircle,
  INCONCLUSIVE: HelpCircle,
};

// ─── component ──────────────────────────────

export default function Posts() {
  const { id } = useParams();
  const { sidebarOpen, closeSidebar } = useOutletContext();
  // For backward compatibility, context may have sidebarOpen or bottomSheetOpen
  const [activeCategory, setActiveCategory] = useState("all");
  const [shareOpen, setShareOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [lastReactedType, setLastReactedType] = useState(null);
  const [premiumOpen, setPremiumOpen] = useState(false);

  const profile = useSelector(selectProfile);
  const isDemoMode = useSelector(selectIsDemoMode);
  const isPremium = useSelector(selectIsPremium);

  const { data: rawPost, isLoading, isError } = useNewsItem(Number(id));
  const post = rawPost ? mapNewsItem(rawPost) : null;

  // Evidence is fetched lazily — only when the sources dropdown is first opened
  const { data: evidence = [], isFetching: evidenceFetching } =
    useEvidenceItems(Number(id), sourcesOpen && isPremium);

  const { data: reactionCounts } = useReactionCounts(Number(id));
  const { data: userReaction } = useUserReaction(Number(id));
  const reactMutation = useReactToNews();
  const removeMutation = useRemoveReaction();

  const counts = reactionCounts || {
    EXCITED: 0,
    NEUTRAL: 0,
    SKEPTICAL: 0,
    ANGRY: 0,
  };
  const totalReactions = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const topReactions = Object.entries(counts)
    .filter(([type, value]) => value > 0 && REACTION_META[type])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  function handleReaction(reactionType) {
    if (!profile?.id) return;

    setLastReactedType(reactionType);
    setTimeout(() => setLastReactedType(null), 260);

    if (userReaction?.reaction_type === reactionType) {
      removeMutation.mutate({ newsItemId: Number(id), userId: profile.id });
    } else {
      reactMutation.mutate({
        newsItemId: Number(id),
        userId: profile.id,
        reactionType,
      });
    }
  }

  const postUrl = buildPostShareUrl(id);

  // ── loading / error states ────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-6 w-6 animate-spin text-teal-500" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 sm:py-20 px-4">
        <p className="text-5xl sm:text-6xl mb-4">🔍</p>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
          المنشور غير موجود
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-xs mx-auto">
          لم نتمكن من العثور على المنشور المطلوب. ربما تم حذفه أو الرابط غير
          صحيح.
        </p>
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition"
        >
          العودة إلى الصفحة الرئيسية
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const confidenceLevel = getConfidenceLevel(post.credibility_score);
  const VerdictIcon =
    VERDICT_ICON[post.verification_status?.toUpperCase()] || HelpCircle;
  const postImage = resolvePostImageView({
    category: post.category,
    categorySlug: post.categorySlug,
    imageUrl: post.imageUrl,
  });

  // ── full article view ─────────────────────

  return (
    <>
      <MobileSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] xl:grid-cols-[270px_1fr_270px] gap-4 lg:gap-5 max-w-6xl mx-auto">
        {/* Left (profile/categories) sidebar — hidden on mobile */}
        <div className="hidden lg:block">
          <UserSidebar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Main article content */}
        <section className="min-w-0">
          <PremiumBanner onTryPremium={() => setPremiumOpen(true)} />

          {/* Back link */}
          <Link
            to="/feed"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition mb-3 sm:mb-4"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            العودة إلى الصفحة الرئيسية
          </Link>

          <article className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* ── Article header ── */}
            <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-gray-100">
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-700 text-sm">
                    Trendy AI
                  </span>
                </div>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {post.publishedAt || post.timeAgo}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {post.category}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-snug mb-4">
                {post.title}
              </h1>

              {/* Status + share row */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <StatusBadge status={post.verification_status} />
                <button
                  onClick={() => setShareOpen(true)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium cursor-pointer transition"
                >
                  <Share2 className="h-4 w-4" />
                  مشاركة
                </button>
              </div>

              {post.verificationNumber > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>تم التحقق منه {post.verificationNumber} مرات</span>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-8 pt-4 sm:pt-6">
              <button
                type="button"
                onClick={() => setImagePreviewOpen(true)}
                title="فتح معاينة الصورة"
                className={`block w-full cursor-zoom-in ${POST_MEDIA_FRAME_PRESETS.details} overflow-hidden rounded-2xl border border-gray-100 bg-gray-50`}
              >
                <img
                  src={postImage.src}
                  alt={`صورة تصنيف ${post.category || "عام"}`}
                  className={POST_MEDIA_IMAGE_CLASS}
                  loading="eager"
                  decoding="async"
                />
              </button>
            </div>

            {/* ── Article body ── */}
            <div className="px-4 sm:px-8 py-6 sm:py-8">
              {post.content && (
                <div className="prose prose-gray prose-sm sm:prose-base max-w-none text-right leading-relaxed text-gray-700 whitespace-pre-line mb-8">
                  {post.content}
                </div>
              )}

              {/* Original source link */}
              {post.url && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium transition mb-8"
                >
                  <ExternalLink className="h-4 w-4" />
                  عرض المصدر الأصلي
                </a>
              )}
            </div>

            {/* ── Credibility score ── */}
            {post.credibility_score > 0 && (
              <div className="px-4 sm:px-8 pb-6">
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-sm font-semibold ${confidenceLevel.text}`}
                    >
                      {confidenceLevel.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">
                        درجة المصداقية
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${confidenceLevel.bar}`}
                      style={{ width: `${post.credibility_score}%` }}
                    />
                  </div>
                  <p className="text-left text-xs text-gray-400 mt-1.5">
                    {post.credibility_score}%
                  </p>
                </div>
              </div>
            )}

            {/* ── Reasoning (AI Insights) ── */}
            {post.reasoning && (
              <div className="px-4 sm:px-8 pb-6 group/insight">
                <div className="relative rounded-3xl p-6 sm:p-8 border border-[#a3cfff]/50 shadow-[0_10px_40px_rgba(163,207,255,0.25)] overflow-hidden transition-all duration-500">
                  {/* Deep Vibrant Gradient Base matching your reference image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#a3cfff]/50 via-[#e0f7ff]/50 to-[#99d7ff]/50 backdrop-blur-2xl -z-10 transition-transform duration-700 group-hover/insight:scale-105" />
                  
                  {/* Large Inner Glows for the soft cloud-like background bubbles */}
                  <div className="absolute top-[-25%] right-[-15%] w-64 h-64 bg-[#a3cfff] opacity-40 rounded-full blur-[80px] -z-10 animate-pulse" />
                  <div className="absolute bottom-[-25%] left-[-15%] w-64 h-64 bg-[#99d7ff] opacity-40 rounded-full blur-[80px] -z-10 animate-pulse" />
                  
                  <div className="flex items-start gap-4 sm:gap-6 relative z-10">
                    <div className="bg-white/70 p-3 sm:p-4 rounded-2xl border border-white/50 shrink-0 rotation-slow">
                      <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 fill-blue-100/50" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#1e3a8a] mb-2 sm:mb-3 text-sm sm:text-lg tracking-tight flex items-center gap-2">
                        تحليل التحقق بالذكاء الاصطناعي
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                      </h3>
                      <p className="text-[#172554] leading-relaxed text-xs sm:text-base font-bold text-right drop-shadow-sm">
                        &ldquo;{post.reasoning}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Evidence / sources (Collapsible) ── */}
            {!isPremium ? (
              <div className="px-4 sm:px-8 pb-6">
                <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 p-6 text-center">
                  <Lock className="h-10 w-10 text-amber-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-amber-900 mb-2">
                    المصادر والأدلة متاحة للمشتركين فقط
                  </h3>
                  <p className="text-sm text-amber-800 mb-4">
                    ترقّ إلى البريميوم للوصول إلى جميع المصادر والأدلة والتحليلات المتقدمة.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPremiumOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition cursor-pointer"
                  >
                    ترقية إلى البريميوم
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 sm:px-8 pb-6">
                <button
                  onClick={() => setSourcesOpen(!sourcesOpen)}
                  className="flex items-center justify-between w-full text-sm font-bold text-gray-700 mb-3 hover:text-teal-600 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-teal-500" />
                    مصادر التحقق
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${sourcesOpen ? 'rotate-180' : ''}`} />
                </button>
                {sourcesOpen && (
                  <div className="space-y-3">
                    {evidenceFetching ? (
                      <div className="flex justify-center py-4">
                        <Loader className="h-5 w-5 animate-spin text-teal-500" />
                      </div>
                    ) : evidence.filter((ev) => ev.title || ev.snippet || ev.url).length > 0 ? (
                      evidence.filter((ev) => ev.title || ev.snippet || ev.url).map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded-lg border border-gray-100 bg-gray-50 p-3 sm:p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 text-right">
                              {ev.title && (
                                <p className="text-sm font-semibold text-gray-800 mb-1 truncate">
                                  {ev.title}
                                </p>
                              )}
                              {ev.snippet && (
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  {ev.snippet}
                                </p>
                              )}
                              {ev.source_type && (
                                <span className="inline-block mt-1.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                                  {ev.source_type}
                                </span>
                              )}
                            </div>
                            {ev.url && (
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 text-teal-500 hover:text-teal-700 transition"
                                title="فتح المصدر"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-3">
                        لا توجد مصادر متاحة
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Verification log ── */}
            {post.verificationLog.length > 0 && (
              <div className="px-4 sm:px-8 pb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <VerdictIcon className="h-4 w-4 text-teal-500" />
                  سجل التحقق
                </h3>
                <div className="space-y-2">
                  {post.verificationLog.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 text-right"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              log.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : log.status === "FAILED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {log.status === "COMPLETED"
                              ? "مكتمل"
                              : log.status === "FAILED"
                                ? "فشل"
                                : log.status === "IN_PROGRESS"
                                  ? "جاري"
                                  : "معلق"}
                          </span>
                          {log.verdict && (
                            <span className="text-xs text-gray-500">
                              الحكم: {log.verdict}
                            </span>
                          )}
                          {log.sources_checked != null && (
                            <span className="text-xs text-gray-400">
                              مصادر: {log.sources_confirmed}/
                              {log.sources_checked}
                            </span>
                          )}
                        </div>
                        {log.llm_reasoning && (
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                            {log.llm_reasoning}
                          </p>
                        )}
                        {log.completed_at && (
                          <p className="text-[10px] text-gray-300 mt-1">
                            {formatDate(log.completed_at)}
                            {log.duration_seconds != null &&
                              ` • ${log.duration_seconds} ثانية`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Ingestion source info ── */}
            {post.source && (
              <div className="px-4 sm:px-8 pb-6">
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 sm:p-4 flex items-center gap-3">
                  <Info className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      المصدر:{" "}
                      <span className="font-medium text-gray-700">
                        {post.source.source_name}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Reactions footer ── */}
            <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 border-t border-gray-100">
              {isDemoMode ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Info className="h-4 w-4 text-teal-500" />
                  <span className="text-xs">
                    للتفاعل مع الأخبار،{" "}
                    <Link
                      to="/signup"
                      className="text-teal-600 hover:underline font-medium"
                    >
                      سجل حساب جديد
                    </Link>{" "}
                    أو{" "}
                    <Link
                      to="/login"
                      className="text-teal-600 hover:underline font-medium"
                    >
                      سجل دخول
                    </Link>
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                  {REACTION_CONFIG.map(
                    (reaction) => {
                      const { type, emoji, label } = reaction;
                      const ReactionIcon = reaction.Icon;
                      const isActive = userReaction?.reaction_type === type;
                      return (
                        <button
                          key={type}
                          onClick={() => handleReaction(type)}
                          title={label}
                          className={`flex flex-row-reverse items-center gap-1.5 text-sm cursor-pointer transition ${
                            isActive
                              ? "text-base font-medium scale-110"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          <span
                            className={`flex items-center justify-center ${lastReactedType === type ? "animate-reaction-pop" : ""}`}
                          >
                            {isActive ? (
                              <span className="text-2xl">{emoji}</span>
                            ) : (
                              <ReactionIcon className="h-[22px] w-[22px] stroke-[1.5]" />
                            )}
                          </span>
                          <span className={isActive ? "block text-gray-800" : "hidden"}>{label}</span>
                          {counts[type] > 0 && (
                            <span className="text-xs font-medium">
                              {counts[type]}
                            </span>
                          )}
                        </button>
                      );
                    },
                  )}
                  </div>

                  {topReactions.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-gray-400">الأكثر تفاعلاً:</span>
                      {topReactions.map(([type, value]) => {
                        const meta = REACTION_META[type];
                        const percent = totalReactions > 0
                          ? Math.round((value / totalReactions) * 100)
                          : 0;

                        return (
                          <span
                            key={type}
                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600"
                          >
                            <span>{meta.emoji}</span>
                            <span>{meta.label}</span>
                            <span className="font-semibold text-gray-500">{percent}%</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              )}
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium cursor-pointer transition"
              >
                <Share2 className="h-4 w-4" />
                مشاركة
              </button>
            </div>
          </article>

          <FeedAdStrip />
        </section>

        {/* Left ads sidebar — xl only */}
        {!isPremium && (
          <aside className="hidden xl:block sticky top-24 self-start space-y-4">
            {MOCK_ADS.slice(2).map((ad) => (
              <AdCard key={ad.id} ad={ad} variant="sidebar" />
            ))}
          </aside>
        )}
      </div>

      {/* Share modal */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        postUrl={postUrl}
        postTitle={post.title}
        postSummary={post.reasoning || post.content || ""}
        postStatus={post.verification_status}
        postConfidence={post.credibility_score}
        postCategory={post.category}
        postImageSrc={postImage.src}
        postId={post.id}
      />

      <PostImagePreviewModal
        isOpen={imagePreviewOpen}
        onClose={() => setImagePreviewOpen(false)}
        imageSrc={postImage.src}
        imageAlt={`صورة تصنيف ${post.category || "عام"}`}
        title={post.title}
        postPath={`/posts/${post.id}`}
        category={post.category}
        description={post.content || ""}
      />

      <PremiumModal isOpen={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </>
  );
}
