import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import {
  useOutletContext,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import FilterTabs from "../features/feed/FilterTabs";
import NewsCard from "../features/feed/NewsCard";
import UserSidebar from "../features/feed/UserSidebar";
import TrendingSidebar from "../features/feed/TrendingSidebar";
import MobileSidebar from "../UI/MobileSidebar";
import {
  useNewsItems,
  useTrendingNews,
  useBatchReactionCounts,
  useBatchUserReactions,
} from "../hooks/useNews";
import { Loader } from "lucide-react";
import { selectProfile } from "../store/authSlice";
import { FeedAdStrip, PremiumBanner } from "../UI/Ads";

function mapNewsItem(item) {
  const categoryMeta = Array.isArray(item.categories)
    ? (item.categories[0] ?? null)
    : (item.categories ?? null);
  const category = categoryMeta?.name || "عام";
  const categorySlug = categoryMeta?.slug || null;
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
    verificationNumber: item.verification_number ?? 0,
    credibility_score: verdict?.confidence ?? item.credibility_score ?? 0,
    reasoning: verdict?.reasoning || null,
    sources_used: verdict?.sources_used || null,
    timeAgo: formatTimeAgo(item.ingested_at || item.published_at),
    category,
    categorySlug,
    imageUrl: item.image_link || item.image_url || null,
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
  const profile = useSelector(selectProfile);
  const searchTerm = searchParams.get("q") || "";
  const activeFilter = searchParams.get("filter") || "ALL";
  const activeCategory = searchParams.get("category") || "all";

  const { sidebarOpen, closeSidebar } = useOutletContext();

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

  // If no category is selected and user has interests, use them
  const categorySlugs = useMemo(() => {
    if (activeCategory !== "all") return [];
    if (profile?.interests?.length > 0) return profile.interests;
    return [];
  }, [activeCategory, profile?.interests]);

  const {
    data: newsData,
    isLoading: newsLoading,
    isFetching: newsFetching,
    isFetchingNextPage,
    isError: newsError,
    error: newsErrorObj,
    isPlaceholderData,
    hasNextPage,
    fetchNextPage,
  } = useNewsItems({
    pageSize: 5,
    verificationStatus: activeFilter,
    categorySlug: activeCategory,
    categorySlugs,
    searchTerm,
  });

  const { data: trendingItems = [] } = useTrendingNews(5);

  // Flatten all pages into a single list and merge with trending items
  const newsItems = useMemo(() => {
    const regularItems = (newsData?.pages || [])
      .flatMap((page) => page.data || [])
      .map(mapNewsItem);

    // If we're searching, don't inject trending items as it might break relevance
    if (searchTerm.trim().length >= 2) return regularItems;

    const trendingMappedForFeed = trendingItems.map(mapNewsItem);

    // Merge and deduplicate
    const combined = [...trendingMappedForFeed, ...regularItems];
    const seenIds = new Set();
    return combined.filter((item) => {
      if (seenIds.has(item.id)) return false;
      seenIds.add(item.id);
      return true;
    });
  }, [newsData, trendingItems, searchTerm]);

  // IDs of all visible items — kept for the sentinel re-check useEffect dep
  const newsItemCount = newsItems.length;

  // Only batch-fetch reactions for the most recently loaded page.
  // The batch hooks seed individual per-item caches after each fetch, so
  // previously loaded items read from cache with zero extra network requests.
  const allPageIds = useMemo(() => {
    const pages = newsData?.pages;
    if (!pages?.length) return [];
    // Fetch reactions for ALL currently displayed items, not just the last page
    return pages.flatMap((page) => (page?.data || []).map((item) => item.id));
  }, [newsData]); // newsData ref is replaced on every page addition

  const { data: batchReactionCounts } = useBatchReactionCounts(allPageIds);
  const { data: batchUserReactions } = useBatchUserReactions(allPageIds);

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
    const categoryMeta = Array.isArray(t.categories)
      ? (t.categories[0] ?? null)
      : (t.categories ?? null);

    return {
      id: t.id,
      title: t.title,
      verification_status:
        verdict?.verdict || t.verification_status || "UNVERIFIED",
      credibility_score: verdict?.confidence ?? t.credibility_score ?? 0,
      image_link: t.image_link,
      image_url: t.image_url,
      category: categoryMeta?.name || "عام",
      categorySlug: categoryMeta?.slug || null,
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

      {/* Tablet (md) view is constrained to max-w-2xl (or 3xl) and centered, and restored to max-w-none on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] xl:grid-cols-[270px_1fr_270px] gap-4 sm:gap-6 md:max-w-2xl lg:max-w-none mx-auto w-full">
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

          {/* Loading indicator for refetches / filter changes (keeps content visible) */}
          {newsFetching && !newsLoading && !isFetchingNextPage && (
            <div className="flex justify-center mb-4 mt-2">
              <img src="/logo/Trendy - GIF.gif" alt="Loading..." className="w-12 h-12 object-contain" />
            </div>
          )}

          {newsLoading ? (
            <div className="flex items-center justify-center py-20">
              <img src="/logo/Trendy - GIF.gif" alt="Loading..." className="w-16 h-16 object-contain" />
            </div>
          ) : newsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-700">حدث خطأ أثناء تحميل الأخبار</p>
              <p className="mt-2 text-sm text-red-600">
                {newsErrorObj?.message || "Unknown error"}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 rounded bg-red-600 px-3 py-1 text-white text-sm hover:bg-red-700"
              >
                إعادة تحميل
              </button>
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
              <PremiumBanner />
              {newsItems.map((item, index) => (
                <div key={item.id} className="space-y-4">
                  <NewsCard item={item} />
                  {/* Show ad strip every 5th post */}
                  {(index + 1) % 5 === 0 && <FeedAdStrip />}
                </div>
              ))}

              {/* Sentinel + Load-more */}
              <div ref={loadMoreRef} className="py-4 flex justify-center">
                {isFetchingNextPage ? (
                  <img src="/logo/Trendy - GIF.gif" alt="Loading..." className="w-10 h-10 object-contain" />
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
