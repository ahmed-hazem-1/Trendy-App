import {
  Share2,
  Sparkles,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkCheck,
  Lock,
  Heart,
  Meh,
  Smile,
} from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import ShareModal from "./ShareModal";
import {
  useReactionCounts,
  useUserReaction,
  useReactToNews,
  useRemoveReaction,
  useEvidenceItems,
  useUserBookmark,
  useToggleBookmark,
} from "../../hooks/useNews";
import { selectProfile, selectIsDemoMode, selectIsPremium } from "../../store/authSlice";
import {
  resolvePostImageView,
  POST_MEDIA_FRAME_PRESETS,
  POST_MEDIA_IMAGE_CLASS,
  PostImagePreviewModal,
} from "../../postMedia";
import { buildPostShareUrl } from "./shareUtils";

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

function NewsCard({ item }) {
  const [insightOpen, setInsightOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [lastReactedType, setLastReactedType] = useState(null);

  // Evidence is fetched lazily — only when the sources dropdown is first opened
  // and ONLY for premium users
  const profile = useSelector(selectProfile);
  const isDemoMode = useSelector(selectIsDemoMode);
  const isPremium = useSelector(selectIsPremium);

  const { data: evidence = [], isFetching: evidenceFetching } =
    useEvidenceItems(item.id, sourcesOpen && isPremium);

  // Using TanStack Query's cache which is already seeded perfectly by the batch hooks!
  const { data: individualCounts } = useReactionCounts(item.id);
  const { data: individualReaction } = useUserReaction(item.id);

  const reactionCounts = individualCounts;
  const userReaction = individualReaction;
  const reactMutation = useReactToNews();
  const removeMutation = useRemoveReaction();

  // Bookmark state
  const { data: bookmarkData } = useUserBookmark(item.id);
  const isBookmarked = !!bookmarkData;
  const toggleBookmarkMutation = useToggleBookmark();

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
    if (!profile?.id) return; // must be logged in

    setLastReactedType(reactionType);
    setTimeout(() => setLastReactedType(null), 260);

    if (userReaction?.reaction_type === reactionType) {
      // Toggle off
      removeMutation.mutate({ newsItemId: item.id, userId: profile.id });
    } else {
      // Set / change reaction
      reactMutation.mutate({
        newsItemId: item.id,
        userId: profile.id,
        reactionType,
      });
    }
  }

  function handleBookmark() {
    if (!profile?.id) {
      console.warn("Cannot bookmark: user not authenticated");
      return; // must be logged in
    }
    console.log("Bookmarking news item:", item.id, "for user:", profile.id);
    toggleBookmarkMutation.mutate(
      {
        newsItemId: item.id,
        userId: profile.id,
      },
      {
        onError: (error) => {
          console.error("Bookmark mutation failed:", error);
        },
        onSuccess: (data) => {
          if (data) {
            console.log("✓ Bookmark added successfully:", data);
          } else {
            console.log("✓ Bookmark removed successfully");
          }
        },
      }
    );
  }

  // Build a shareable URL for this post
  const postUrl = buildPostShareUrl(item.id);
  const postImage = resolvePostImageView({
    category: item.category,
    categorySlug: item.categorySlug,
    imageUrl: item.imageUrl,
  });
  return (
    <>
      <article className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-5 pt-2.5 sm:pt-4 mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <StatusBadge status={item.verification_status} />
            {!isDemoMode && (
              <button
                onClick={handleBookmark}
                title={isBookmarked ? "إزالة من المحفوظات" : "حفظ"}
                className={`p-1 sm:p-1.5 rounded-lg transition cursor-pointer ${
                  isBookmarked
                    ? "text-teal-600 bg-teal-50 hover:bg-teal-100"
                    : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </button>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-teal-50 border border-teal-100">
              <span className="text-[10px] sm:text-xs font-bold text-teal-700">
                {item.category || "عام"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <span className="text-[10px] sm:text-xs text-gray-400">{item.timeAgo}</span>
            <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">•</span>
            <div className="text-start leading-3 hidden sm:block">
              <span className="text-xs sm:text-sm font-bold text-gray-700 block">
                Trendy AI
              </span>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-5 mb-2 sm:mb-3">
          <button
            type="button"
            onClick={() => setImagePreviewOpen(true)}
            title="فتح معاينة الصورة"
            className={`block w-full cursor-zoom-in ${POST_MEDIA_FRAME_PRESETS.feed} overflow-hidden rounded-xl border border-gray-100 bg-gray-50`}
          >
            <img
              src={postImage.src}
              alt={`صورة تصنيف ${item.category || "عام"}`}
              className={POST_MEDIA_IMAGE_CLASS}
              loading="lazy"
              decoding="async"
            />
          </button>
        </div>

        {/* Title */}
        <Link
          to={`/posts/${item.id}`}
          className="block hover:bg-gray-50/50 transition"
        >
          <h2 className="text-sm sm:text-base lg:text-lg duration-200 hover:text-accent-emerald font-bold text-gray-900 leading-snug px-3 sm:px-5 mb-2 sm:mb-3">
            {item.title}
          </h2>

          {/* Subtitle */}
          {item.content && (
            <p className="text-xs sm:text-sm text-gray-500 px-3 sm:px-5 mb-3 sm:mb-4 line-clamp-2">
              {item.content}
            </p>
          )}
        </Link>

        {/* AI Verification Insight */}
        {item.reasoning && (
          <div className="px-3 sm:px-5 mb-3 sm:mb-4">
            <button
              onClick={() => setInsightOpen(!insightOpen)}
              className={`flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold mb-2 ms-auto cursor-pointer transition-all duration-300 ${
                !insightOpen ? "animate-text-glow scale-105" : "text-gray-500 hover:text-teal-600"
              }`}
            >
              تحليل التحقق بالذكاء الاصطناعي
              <Sparkles className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${!insightOpen ? "text-teal-600 fill-teal-100/50" : "text-teal-500"}`} />
            </button>

            {insightOpen && (
              <div className="animate-fade-in-down origin-top">
                <div className="relative rounded-2xl p-4 sm:p-5 mb-4 border border-[#a3cfff]/80 shadow-[0_8px_30px_rgb(163,207,255,0.2)] overflow-hidden group/insight animate-neon-glow">
                  {/* Deep Vibrant Gradient Base (Reduced transparency to prevent "wash out") */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#a3cfff]/40 via-[#e0f7ff]/40 to-[#99d7ff]/40 backdrop-blur-md -z-10 transition-transform duration-500 group-hover/insight:scale-105" />
                  
                  {/* Large Inner Glows for the "Cloud" effect from your image */}
                  <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-[#a3cfff] opacity-30 rounded-full blur-[60px] -z-10 animate-pulse" />
                  <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-[#99d7ff] opacity-30 rounded-full blur-[60px] -z-10 animate-pulse" />
                  
                  <div className="flex items-start gap-3 sm:gap-4 relative z-10">
                    <div className="bg-white/60 p-2 sm:p-2.5 rounded-2xl border border-white/40 shrink-0 mt-0.5 rotation-slow">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 fill-blue-100/50" />
                    </div>
                    <p className="text-xs sm:text-sm text-[#1e3a8a] leading-relaxed font-bold text-right drop-shadow-sm">
                      &ldquo;{item.reasoning}&rdquo;
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSourcesOpen(!sourcesOpen)}
                  className="w-full flex items-center justify-center gap-1 text-center text-[10px] sm:text-xs font-semibold text-gray-500 hover:text-gray-700 transition cursor-pointer"
                >
                  {isPremium ? (
                    <>
                      {sourcesOpen ? "إخفاء مصادر التحقق" : "عرض مصادر التحقق"}
                      {sourcesOpen ? (
                        <ChevronUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      ) : (
                        <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      )}
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      مزايا البريميوم
                    </>
                  )}
                </button>

                {sourcesOpen && isPremium && (
                  <div className="mt-3 space-y-2">
                    {/* Evidence items — lazily loaded */}
                    {evidenceFetching ? (
                      <p className="text-xs text-gray-400 text-center py-2">جارٍ تحميل المصادر…</p>
                    ) : evidence?.length > 0 ? (
                      evidence.map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0 text-right">
                              {ev.title && (
                                <p className="text-xs font-semibold text-gray-700 mb-0.5 truncate">
                                  {ev.title}
                                </p>
                              )}
                              {ev.snippet && (
                                <p className="text-[11px] text-gray-500 leading-relaxed">
                                  {ev.snippet}
                                </p>
                              )}
                              {ev.source_type && (
                                <span className="inline-block mt-1 text-[10px] font-medium text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                                  {ev.source_type}
                                </span>
                              )}
                            </div>
                            {ev.url && (
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 text-teal-500 hover:text-teal-700 transition mt-0.5"
                                title="فتح المصدر"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : item.sources_used ? (
                      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-xs text-gray-600 leading-relaxed text-right whitespace-pre-line">
                          {item.sources_used}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-2">
                        لا توجد مصادر متاحة حالياً
                      </p>
                    )}
                  </div>
                )}

                {!isPremium && sourcesOpen && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                    <p className="text-xs text-amber-900 mb-2">
                      الوصول إلى المصادر والأدلة حصري للمشتركين في البريميوم
                    </p>
                    <Link
                      to="/feed"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition"
                    >
                      ترقية إلى البريميوم
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 border-t border-gray-100">
          {isDemoMode ? (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
              <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-500" />
              <span className="text-[10px] sm:text-xs">
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
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 sm:gap-3">
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
                      className={`flex flex-row-reverse items-center gap-1 text-xs sm:text-sm cursor-pointer transition ${
                        isActive
                          ? "text-sm sm:text-base font-medium scale-110"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <span
                        className={`flex items-center justify-center ${lastReactedType === type ? "animate-reaction-pop" : ""}`}
                      >
                        {isActive ? (
                          <span className="text-xl sm:text-2xl">{emoji}</span>
                        ) : (
                          <ReactionIcon className="h-4 w-4 sm:h-5 sm:w-5 stroke-[1.5]" />
                        )}
                      </span>
                      {counts[type] > 0 && <span className="text-[10px] sm:text-xs font-semibold">{counts[type]}</span>}
                    </button>
                  );
                },
              )}
              </div>

              {topReactions.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] sm:text-[11px] text-gray-400">الأكثر تفاعلاً:</span>
                  {topReactions.map(([type, value]) => {
                    const meta = REACTION_META[type];
                    const percent = totalReactions > 0
                      ? Math.round((value / totalReactions) * 100)
                      : 0;

                    return (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] sm:text-[11px] text-gray-600"
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
            className="flex items-center gap-1 sm:gap-1.5 text-gray-500 hover:text-gray-700 text-xs sm:text-sm font-medium cursor-pointer transition"
          >
            <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">مشاركة</span>
          </button>
        </div>
      </article>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        postUrl={postUrl}
        postTitle={item.title}
        postSummary={item.reasoning || item.content || ""}
        postStatus={item.verification_status}
        postConfidence={item.credibility_score}
        postCategory={item.category}
        postImageSrc={postImage.src}
        postId={item.id}
      />

      <PostImagePreviewModal
        isOpen={imagePreviewOpen}
        onClose={() => setImagePreviewOpen(false)}
        imageSrc={postImage.src}
        imageAlt={`صورة تصنيف ${item.category || "عام"}`}
        title={item.title}
        postPath={`/posts/${item.id}`}
        category={item.category}
        description={item.content || item.reasoning || ""}
      />
    </>
  );
}

export default NewsCard;
