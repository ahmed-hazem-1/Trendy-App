import {
  Share2,
  PartyPopper,
  ThumbsUp,
  Smile,
  Sparkles,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkCheck,
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
import { selectProfile, selectIsDemoMode } from "../../store/authSlice";

const REACTION_CONFIG = [
  {
    type: "EXCITED",
    icon: ThumbsUp,
    label: "متحمس",
    activeColor: "text-teal-500",
  },
  {
    type: "NEUTRAL",
    icon: Smile,
    label: "محايد",
    activeColor: "text-blue-500",
  },
  {
    type: "SKEPTICAL",
    icon: PartyPopper,
    label: "متشكك",
    activeColor: "text-amber-500",
  },
];

function NewsCard({
  item,
  reactionCounts: batchCounts,
  userReaction: batchUserReaction,
}) {
  const [insightOpen, setInsightOpen] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Evidence is fetched lazily — only when the sources dropdown is first opened
  const { data: evidence = [], isFetching: evidenceFetching } =
    useEvidenceItems(item.id, sourcesOpen);

  const profile = useSelector(selectProfile);
  const isDemoMode = useSelector(selectIsDemoMode);

  // Use batch data when available; fall back to individual queries (e.g. Posts page)
  const hasBatch = batchCounts !== undefined;
  const { data: individualCounts } = useReactionCounts(
    hasBatch ? null : item.id,
  );
  const { data: individualReaction } = useUserReaction(
    hasBatch ? null : item.id,
  );

  const reactionCounts = batchCounts || individualCounts;
  const userReaction = batchUserReaction || individualReaction;
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
  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

  function handleReaction(reactionType) {
    if (!profile?.id) return; // must be logged in
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
    if (!profile?.id) return; // must be logged in
    toggleBookmarkMutation.mutate({
      newsItemId: item.id,
      userId: profile.id,
    });
  }

  // Build a shareable URL for this post
  const postUrl = `${window.location.origin}/posts/${item.id}`;

  return (
    <>
      <article className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
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
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-400 opacity-20 blur-sm"></div>
              <img
                src="/logo/Trendy-logo-no-text.png"
                alt="Trendy"
                className="relative h-7 w-7 sm:h-9 sm:w-9 rounded-full object-cover ring-2 ring-teal-200 shadow-md"
              />
            </div>
          </div>
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
              className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold text-gray-500 mb-2 ms-auto cursor-pointer hover:text-gray-700 transition"
            >
              تحليل التحقق بالذكاء الاصطناعي
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-teal-500" />
            </button>

            {insightOpen && (
              <>
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 sm:p-4 mb-3">
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed text-right">
                    &ldquo;{item.reasoning}&rdquo;
                  </p>
                </div>
                <button
                  onClick={() => setSourcesOpen(!sourcesOpen)}
                  className="w-full flex items-center justify-center gap-1 text-center text-[10px] sm:text-xs font-semibold text-gray-500 hover:text-gray-700 transition cursor-pointer"
                >
                  {sourcesOpen ? "إخفاء مصادر التحقق" : "عرض مصادر التحقق"}
                  {sourcesOpen ? (
                    <ChevronUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  ) : (
                    <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  )}
                </button>

                {sourcesOpen && (
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
              </>
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
            <div className="flex items-center gap-2 sm:gap-3">
              {REACTION_CONFIG.map(
                ({ type, icon: Icon, label, activeColor }) => {
                  const isActive = userReaction?.reaction_type === type;
                  return (
                    <button
                      key={type}
                      onClick={() => handleReaction(type)}
                      title={label}
                      className={`flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm cursor-pointer transition ${
                        isActive
                          ? activeColor
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {counts[type] > 0 && <span className="text-[10px] sm:text-xs">{counts[type]}</span>}
                    </button>
                  );
                },
              )}
              {totalReactions > 0 && (
                <span className="text-[10px] sm:text-xs text-gray-300 mr-1">
                  {totalReactions}
                </span>
              )}
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
      />
    </>
  );
}

export default NewsCard;
