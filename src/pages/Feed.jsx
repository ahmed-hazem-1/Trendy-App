import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import {
  useOutletContext,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import FilterTabs from "../features/feed/FilterTabs";
import NewsCard from "../features/feed/NewsCard";
import UserSidebar from "../features/feed/UserSidebar";
import TrendingSidebar from "../features/feed/TrendingSidebar";
import BottomSheet from "../UI/BottomSheet";
import MobileSidebar from "../UI/MobileSidebar";
import {
  useNewsItems,
  useTrendingNews,
  useBatchReactionCounts,
  useBatchUserReactions,
} from "../hooks/useNews";
import { Loader } from "lucide-react";

/**
 * Helper to transform a Supabase news_items row into the shape the UI expects.
 */
function mapNewsItem(item) {
  const category = item.news_categories?.[0]?.categories?.name || "عام";
  // verdicts comes as an object (unique FK) or array; normalise
  const verdict = Array.isArray(item.verdicts)
    ? (item.verdicts[0] ?? null)
    : (item.verdicts ?? null);
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    // Derive status from verdict.verdict; fall back to news_items.verification_status
    verification_status:
      verdict?.verdict || item.verification_status || "UNVERIFIED",
    credibility_score: verdict?.confidence ?? item.credibility_score ?? 0,
    reasoning: verdict?.reasoning || null,
    sources_used: verdict?.sources_used || null,
    timeAgo: formatTimeAgo(item.ingested_at || item.published_at),
    category,
    likes: 0,
    reactions: 0,
  };
}

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

export default function Feed() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchTerm = searchParams.get("q") || "";
  const activeFilter = searchParams.get("filter") || "ALL";
  const activeCategory = searchParams.get("category") || "all";

  const { sidebarOpen, closeSidebar, bottomSheetOpen, closeBottomSheet, openBottomSheet } = useOutletContext();
  const [localBottomSheetOpen, setLocalBottomSheetOpen] = useState(false);

  // Use context state if available (from AppLayout), otherwise use local state
  const isBottomSheetOpen = bottomSheetOpen !== undefined ? bottomSheetOpen : localBottomSheetOpen;
  const handleCloseBottomSheet = closeBottomSheet || (() => setLocalBottomSheetOpen(false));
  const handleOpenBottomSheet = openBottomSheet || (() => setLocalBottomSheetOpen(true));

  // Use navigate() directly so all useSearchParams consumers re-render.
  // Read from window.location.search for always-fresh params.
  const handleFilterChange = (filter) => {
    const next = new URLSearchParams(window.location.search);
    if (filter && filter !== "ALL") {
      next.set("filter", filter);
    } else {
      next.delete("filter");
    }
    navigate("?" + next.toString(), { replace: true });
  };
  const handleCategoryChange = (cat) => {
    const next = new URLSearchParams(window.location.search);
    if (cat && cat !== "all") {
      next.set("category", cat);
    } else {
      next.delete("category");
    }
    navigate("?" + next.toString(), { replace: true });
  };

  const {
    data: newsData,
    isLoading: newsLoading,
    isFetching: newsFetching,
    isFetchingNextPage,
    isError: newsError,
    isPlaceholderData,
    hasNextPage,
    fetchNextPage,
  } = useNewsItems({
    pageSize: 5,
    verificationStatus: activeFilter,
    categorySlug: activeCategory,
    searchTerm,
  });

  const { data: trendingItems = [] } = useTrendingNews(5);

  // Flatten all pages into a single list
  const newsItems = useMemo(
    () =>
      (newsData?.pages || [])
        .flatMap((page) => page.data || [])
        .map(mapNewsItem),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [newsData], // newsData reference is replaced by React Query whenever pages change
  );

  // IDs of all visible items — kept for the sentinel re-check useEffect dep
  const newsItemCount = newsItems.length;

  // Only batch-fetch reactions for the most recently loaded page.
  // The batch hooks seed individual per-item caches after each fetch, so
  // previously loaded items read from cache with zero extra network requests.
  const lastPageIds = useMemo(() => {
    const pages = newsData?.pages;
    if (!pages?.length) return [];
    const lastPage = pages[pages.length - 1];
    return (lastPage?.data || []).map((item) => item.id);
  }, [newsData]); // newsData ref is replaced on every page addition

  const { data: batchReactionCounts } = useBatchReactionCounts(lastPageIds);
  const { data: batchUserReactions } = useBatchUserReactions(lastPageIds);

  // ── Infinite-scroll observer ──
  // Store latest fetch-more logic in a ref so the observer callback never
  // captures stale closures.
  const fetchMoreRef = useRef(null);
  useEffect(() => {
    fetchMoreRef.current = () => {
      if (hasNextPage && !isFetchingNextPage && !isPlaceholderData) {
        fetchNextPage();
      }
    };
  }, [hasNextPage, isFetchingNextPage, isPlaceholderData, fetchNextPage]);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  // Stable callback ref — only sets up / tears down the observer when the
  // sentinel DOM node actually mounts / unmounts (not on every render).
  const loadMoreRef = useCallback((node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    sentinelRef.current = node;
    if (node) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            fetchMoreRef.current?.();
          }
        },
        { rootMargin: "200px" },
      );
      observerRef.current.observe(node);
    }
  }, []);

  // Re-check when conditions change — handles the case where the sentinel
  // was already visible but a previous guard (isFetchingNextPage / placeholder)
  // blocked the call. The IntersectionObserver won't re-fire because the
  // element never left the viewport, so we manually check bounds here.
  useEffect(() => {
    if (
      !sentinelRef.current ||
      !hasNextPage ||
      isFetchingNextPage ||
      isPlaceholderData
    )
      return;
    const rect = sentinelRef.current.getBoundingClientRect();
    if (rect.top < window.innerHeight + 200) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    isFetchingNextPage,
    isPlaceholderData,
    fetchNextPage,
    // newsItemCount changes after each page loads, triggering a re-check
    newsItemCount,
  ]);
  const trendingMapped = trendingItems.map((t) => {
    const verdict = Array.isArray(t.verdicts)
      ? (t.verdicts[0] ?? null)
      : (t.verdicts ?? null);
    return {
      id: t.id,
      title: t.title,
      verification_status:
        verdict?.verdict || t.verification_status || "UNVERIFIED",
      credibility_score: verdict?.confidence ?? t.credibility_score ?? 0,
    };
  });

  return (
    <>
      {/* Mobile sidebar for profile & categories */}
      <MobileSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Bottom sheet for mobile categories */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={handleCloseBottomSheet}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] xl:grid-cols-[270px_1fr_350px] gap-4 sm:gap-6 pb-20 lg:pb-0">
        {/* Left Sidebar — hidden on mobile */}
        <div className="hidden lg:block">
          <UserSidebar
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* Main Feed */}
        <section className="min-w-0">
          <FilterTabs active={activeFilter} onChange={handleFilterChange} />

          {/* Subtle loading bar for refetches (keeps content visible) */}
          {newsFetching && !newsLoading && (
            <div className="w-full h-0.5 bg-gray-100 rounded overflow-hidden mb-3">
              <div className="h-full w-1/3 bg-teal-400 rounded animate-pulse" />
            </div>
          )}

          {newsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="h-6 w-6 animate-spin text-teal-500" />
            </div>
          ) : newsError ? (
            <div className="text-center py-20">
              <p className="text-sm text-red-500">
                حدث خطأ أثناء تحميل الأخبار
              </p>
            </div>
          ) : newsItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">📰</p>
              <p className="text-sm text-gray-500">
                {searchTerm
                  ? `لا توجد نتائج لـ "${searchTerm}"`
                  : "لا توجد أخبار حالياً"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {newsItems.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  reactionCounts={batchReactionCounts?.[item.id]}
                  userReaction={batchUserReactions?.[item.id]}
                />
              ))}

              {/* Sentinel + Load-more */}
              <div ref={loadMoreRef} className="py-4 flex justify-center">
                {isFetchingNextPage ? (
                  <Loader className="h-5 w-5 animate-spin text-teal-500" />
                ) : hasNextPage ? (
                  <button
                    onClick={() => fetchNextPage()}
                    className="w-full py-3 text-sm font-semibold text-teal-600 hover:text-teal-700 transition cursor-pointer"
                  >
                    عرض المزيد
                  </button>
                ) : (
                  newsItems.length > 0 && (
                    <p className="text-xs text-gray-400">لا يوجد المزيد</p>
                  )
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right Sidebar — hidden below xl */}
        <div className="hidden xl:block">
          <TrendingSidebar trendingItems={trendingMapped} />
        </div>
      </div>
    </>
  );
}
