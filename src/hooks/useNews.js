import { useEffect } from "react";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
  fetchNewsItems,
  fetchNewsItemById,
  fetchTrendingNews,
  fetchCategories,
  fetchReactionCounts,
  fetchBatchReactionCounts,
  fetchBatchUserReactions,
  fetchUserReaction,
  upsertReaction,
  removeReaction,
  toggleBookmark,
  fetchUserBookmarks,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  searchNews,
  fetchEvidenceItems,
} from "../api/newsApi";
import { selectProfile } from "../store/authSlice";

// ─────────────────────────────────────────────
// News Items
// ─────────────────────────────────────────────

/**
 * Hook to fetch news items with infinite scroll.
 * Returns an infinite query that loads `pageSize` items per page.
 */
export function useNewsItems({
  pageSize = 5,
  verificationStatus,
  categorySlug,
  searchTerm = "",
} = {}) {
  const trimmed = searchTerm.trim();
  const isSearching = trimmed.length >= 2;

  return useInfiniteQuery({
    queryKey: isSearching
      ? ["newsItems", "search", trimmed, { verificationStatus, categorySlug }]
      : ["newsItems", { pageSize, verificationStatus, categorySlug }],
    queryFn: ({ pageParam = 1 }) =>
      isSearching
        ? searchNews(trimmed, {
            limit: pageSize,
            verificationStatus,
            categorySlug,
          })
        : fetchNewsItems({
            page: pageParam,
            pageSize,
            verificationStatus,
            categorySlug,
          }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Safety: stop if last page returned no items (prevents infinite
      // empty-page loops caused by count/data drift under concurrent writes).
      if (!lastPage.data?.length) return undefined;

      const totalFetched = allPages.reduce(
        (sum, p) => sum + (p.data?.length || 0),
        0,
      );
      // If total fetched < total count, there are more pages
      if (lastPage.count != null && totalFetched < lastPage.count) {
        return allPages.length + 1;
      }
      return undefined; // no more pages
    },
    staleTime: isSearching ? 1000 * 60 : 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook to fetch a single news item by ID.
 */
export function useNewsItem(id) {
  return useQuery({
    queryKey: ["newsItem", id],
    queryFn: () => fetchNewsItemById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook for trending news items.
 */
export function useTrendingNews(limit = 5) {
  return useQuery({
    queryKey: ["trendingNews", limit],
    queryFn: () => fetchTrendingNews(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ─────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 30, // 30 minutes – rarely changes
  });
}

// ─────────────────────────────────────────────
// Reactions
// ─────────────────────────────────────────────

export function useReactionCounts(newsItemId) {
  return useQuery({
    queryKey: ["reactionCounts", newsItemId],
    queryFn: () => fetchReactionCounts(newsItemId),
    enabled: !!newsItemId,
    staleTime: 1000 * 30,
  });
}

/**
 * Batch-fetch reaction counts for a page of news items.
 * After fetching, seeds individual ["reactionCounts", id] cache entries so
 * previously loaded items never re-fetch when the list grows on scroll.
 */
export function useBatchReactionCounts(newsItemIds = []) {
  const queryClient = useQueryClient();
  const stableKey = newsItemIds.join(",");

  const query = useQuery({
    queryKey: ["batchReactionCounts", stableKey],
    queryFn: () => fetchBatchReactionCounts(newsItemIds),
    enabled: newsItemIds.length > 0,
    staleTime: 1000 * 30,
  });

  // Seed individual per-item caches so old items read from cache on next scroll
  useEffect(() => {
    if (!query.data) return;
    Object.entries(query.data).forEach(([id, counts]) => {
      queryClient.setQueryData(["reactionCounts", Number(id)], counts);
    });
  }, [query.data, queryClient]);

  return query;
}

/**
 * Batch-fetch user reactions for a page of news items.
 * After fetching, seeds individual ["userReaction", id, userId] cache entries.
 */
export function useBatchUserReactions(newsItemIds = []) {
  const profile = useSelector(selectProfile);
  const queryClient = useQueryClient();
  const stableKey = newsItemIds.join(",");

  const query = useQuery({
    queryKey: ["batchUserReactions", stableKey, profile?.id],
    queryFn: () => fetchBatchUserReactions(newsItemIds, profile.id),
    enabled: newsItemIds.length > 0 && !!profile?.id,
    staleTime: 1000 * 30,
  });

  // Seed individual per-item user-reaction caches
  useEffect(() => {
    if (!query.data) return;
    newsItemIds.forEach((id) => {
      queryClient.setQueryData(
        ["userReaction", id, profile?.id],
        query.data[id] ?? null,
      );
    });
  }, [query.data, queryClient, profile?.id]); // newsItemIds omitted intentionally — data change is the trigger

  return query;
}

/**
 * Lazy-fetch evidence items for a news card — only fires when `enabled` is true
 * (i.e. when the user opens the sources dropdown).
 */
export function useEvidenceItems(newsItemId, enabled = false) {
  return useQuery({
    queryKey: ["evidenceItems", newsItemId],
    queryFn: () => fetchEvidenceItems(newsItemId),
    enabled: !!newsItemId && enabled,
    staleTime: 1000 * 60 * 10, // evidence rarely changes
  });
}

export function useUserReaction(newsItemId) {
  const profile = useSelector(selectProfile);
  return useQuery({
    queryKey: ["userReaction", newsItemId, profile?.id],
    queryFn: () => fetchUserReaction(newsItemId, profile.id),
    enabled: !!newsItemId && !!profile?.id,
  });
}

export function useReactToNews() {
  const queryClient = useQueryClient();
  const profile = useSelector(selectProfile);

  return useMutation({
    mutationFn: upsertReaction,
    onSuccess: (_data, variables) => {
      // Invalidate only the specific item's individual caches — not the whole
      // batch — so other visible cards are unaffected.
      queryClient.invalidateQueries({
        queryKey: ["reactionCounts", variables.newsItemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["userReaction", variables.newsItemId, profile?.id],
      });
    },
  });
}

export function useRemoveReaction() {
  const queryClient = useQueryClient();
  const profile = useSelector(selectProfile);

  return useMutation({
    mutationFn: removeReaction,
    onSuccess: (_data, variables) => {
      // Invalidate only the specific item's individual caches.
      queryClient.invalidateQueries({
        queryKey: ["reactionCounts", variables.newsItemId],
      });
      queryClient.invalidateQueries({
        queryKey: ["userReaction", variables.newsItemId, profile?.id],
      });
    },
  });
}

// ─────────────────────────────────────────────
// Bookmarks
// ─────────────────────────────────────────────

export function useUserBookmarks() {
  const profile = useSelector(selectProfile);

  return useQuery({
    queryKey: ["userBookmarks", profile?.id],
    queryFn: () => fetchUserBookmarks(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60,
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBookmarks"] });
    },
  });
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

export function useNotifications(limit = 20) {
  const profile = useSelector(selectProfile);

  return useQuery({
    queryKey: ["notifications", profile?.id, limit],
    queryFn: () => fetchNotifications(profile.id, { limit }),
    enabled: !!profile?.id,
    staleTime: 1000 * 30,
  });
}

export function useUnreadNotificationCount() {
  const profile = useSelector(selectProfile);

  return useQuery({
    queryKey: ["unreadNotificationCount", profile?.id],
    queryFn: () => fetchUnreadNotificationCount(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 15, // 15 seconds
    refetchInterval: 1000 * 60, // Poll every 60 seconds
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["unreadNotificationCount"],
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const profile = useSelector(selectProfile);

  return useMutation({
    mutationFn: () => markAllNotificationsRead(profile.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["unreadNotificationCount"],
      });
    },
  });
}

// ─────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────

export function useSearchNews(query, options = {}) {
  return useQuery({
    queryKey: ["searchNews", query],
    queryFn: () => searchNews(query, options),
    enabled: !!query && query.length >= 2,
    staleTime: 1000 * 60,
  });
}
