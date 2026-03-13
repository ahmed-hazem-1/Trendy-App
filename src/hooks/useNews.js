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
  fetchUserBookmark,
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
  categorySlugs, // Now supporting multiple categories
  searchTerm = "",
} = {}) {
  const trimmed = searchTerm.trim();
  const isSearching = trimmed.length >= 2;

  return useInfiniteQuery({
    queryKey: isSearching
      ? ["newsItems", "search", trimmed, { verificationStatus, categorySlug, categorySlugs }]
      : ["newsItems", { pageSize, verificationStatus, categorySlug, categorySlugs }],
    queryFn: ({ pageParam = 1 }) =>
      isSearching
        ? searchNews(trimmed, {
            limit: pageSize,
            verificationStatus,
            categorySlug,
            categorySlugs,
          })
        : fetchNewsItems({
            page: pageParam,
            pageSize,
            verificationStatus,
            categorySlug,
            categorySlugs,
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
    retry: 3, // Retry up to 3 times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
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
    staleTime: 1000 * 5, // 5 seconds for faster updates
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
    staleTime: 1000 * 60 * 5, // 5 minutes - match user reaction staleTime for consistency
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
    staleTime: 1000 * 60 * 5, // 5 minutes - match batch reaction counts for consistency
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
    staleTime: 1000 * 60 * 5, // 5 minutes - reactions rarely change
  });
}

export function useReactToNews() {
  const queryClient = useQueryClient();
  const profile = useSelector(selectProfile);

  return useMutation({
    mutationFn: upsertReaction,
    onMutate: async ({ newsItemId, userId, reactionType }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["reactionCounts", newsItemId] });
      await queryClient.cancelQueries({ queryKey: ["userReaction", newsItemId] });

      // Snapshot previous values
      const previousCounts = queryClient.getQueryData(["reactionCounts", newsItemId]);
      const previousUserReaction = queryClient.getQueryData(["userReaction", newsItemId, userId]);

      // Optimistically update reaction counts
      queryClient.setQueryData(["reactionCounts", newsItemId], (old) => {
        if (!old) return { EXCITED: 0, NEUTRAL: 0, SKEPTICAL: 0, ANGRY: 0, [reactionType]: 1 };
        const updated = { ...old };
        // If user had a previous reaction, decrement it
        if (previousUserReaction?.reaction_type) {
          updated[previousUserReaction.reaction_type] = Math.max(0, (updated[previousUserReaction.reaction_type] || 0) - 1);
        }
        // Increment new reaction
        updated[reactionType] = (updated[reactionType] || 0) + 1;
        return updated;
      });

      // Optimistically update user reaction
      queryClient.setQueryData(["userReaction", newsItemId, userId], {
        news_item_id: newsItemId,
        user_id: userId,
        reaction_type: reactionType,
      });

      return { previousCounts, previousUserReaction };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCounts) {
        queryClient.setQueryData(["reactionCounts", variables.newsItemId], context.previousCounts);
      }
      if (context?.previousUserReaction !== undefined) {
        queryClient.setQueryData(["userReaction", variables.newsItemId, variables.userId], context.previousUserReaction);
      }
    },
    onSuccess: (data, variables) => {
      // Set the data directly from server response instead of invalidating
      // This keeps the UI instant while ensuring data accuracy
      if (data) {
        queryClient.setQueryData(["userReaction", variables.newsItemId, variables.userId], data);
      }
      // Invalidate batch cache so the update is reflected in feed
      queryClient.invalidateQueries({ queryKey: ["batchReactionCounts"] });
      queryClient.invalidateQueries({ queryKey: ["batchUserReactions"] });
    },
  });
}

export function useRemoveReaction() {
  const queryClient = useQueryClient();
  const profile = useSelector(selectProfile);

  return useMutation({
    mutationFn: removeReaction,
    onMutate: async ({ newsItemId, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["reactionCounts", newsItemId] });
      await queryClient.cancelQueries({ queryKey: ["userReaction", newsItemId] });

      // Snapshot previous values
      const previousCounts = queryClient.getQueryData(["reactionCounts", newsItemId]);
      const previousUserReaction = queryClient.getQueryData(["userReaction", newsItemId, userId]);

      // Optimistically update reaction counts (decrement the removed reaction)
      queryClient.setQueryData(["reactionCounts", newsItemId], (old) => {
        if (!old || !previousUserReaction?.reaction_type) return old;
        const updated = { ...old };
        updated[previousUserReaction.reaction_type] = Math.max(0, (updated[previousUserReaction.reaction_type] || 0) - 1);
        return updated;
      });

      // Optimistically clear user reaction
      queryClient.setQueryData(["userReaction", newsItemId, userId], null);

      return { previousCounts, previousUserReaction };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCounts) {
        queryClient.setQueryData(["reactionCounts", variables.newsItemId], context.previousCounts);
      }
      if (context?.previousUserReaction !== undefined) {
        queryClient.setQueryData(["userReaction", variables.newsItemId, variables.userId], context.previousUserReaction);
      }
    },
    onSuccess: () => {
      // Invalidate batch cache so the update is reflected in feed
      queryClient.invalidateQueries({ queryKey: ["batchReactionCounts"] });
      queryClient.invalidateQueries({ queryKey: ["batchUserReactions"] });
    },
  });
}

// ─────────────────────────────────────────────
// Bookmarks
// ─────────────────────────────────────────────

export function useUserBookmark(newsItemId) {
  const profile = useSelector(selectProfile);

  return useQuery({
    queryKey: ["userBookmark", newsItemId, profile?.id],
    queryFn: () => fetchUserBookmark(newsItemId, profile.id),
    enabled: !!newsItemId && !!profile?.id,
    staleTime: 1000 * 5, // 5 seconds for faster updates
  });
}

export function useUserBookmarks() {
  const profile = useSelector(selectProfile);

  return useQuery({
    queryKey: ["userBookmarks", profile?.id],
    queryFn: () => fetchUserBookmarks(profile.id),
    enabled: !!profile?.id,
    staleTime: 0, // Treat as stale immediately so refetch happens quickly
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes (was cacheTime)
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleBookmark,
    onMutate: async ({ newsItemId, userId }) => {
      console.log("🔄 Bookmark mutation started for newsItemId:", newsItemId, "userId:", userId);
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["userBookmark", newsItemId, userId] });
      await queryClient.cancelQueries({ queryKey: ["userBookmarks", userId] });

      // Snapshot the previous values
      const previousBookmark = queryClient.getQueryData(["userBookmark", newsItemId, userId]);
      const previousBookmarks = queryClient.getQueryData(["userBookmarks", userId]);

      // Determine if currently bookmarked
      const isCurrentlyBookmarked = !!previousBookmark;
      console.log("Current bookmark state:", isCurrentlyBookmarked ? "bookmarked" : "not bookmarked");

      // Optimistically update individual bookmark state
      queryClient.setQueryData(["userBookmark", newsItemId, userId], (old) => {
        if (isCurrentlyBookmarked) {
          return null; // Remove
        } else {
          return { id: Math.random(), news_item_id: newsItemId, user_id: userId, saved_at: new Date().toISOString() };
        }
      });

      // NOTE: We don't update the bookmarks list here because we don't have the full nested data
      // It will be refetched after onSuccess

      return { previousBookmark, previousBookmarks, isCurrentlyBookmarked };
    },
    onError: (err, variables, context) => {
      console.error("❌ Bookmark toggle failed:", err);
      // Rollback on error
      if (context?.previousBookmark !== undefined) {
        queryClient.setQueryData(["userBookmark", variables.newsItemId, variables.userId], context.previousBookmark);
      }
      if (context?.previousBookmarks !== undefined) {
        queryClient.setQueryData(["userBookmarks", variables.userId], context.previousBookmarks);
      }
    },
    onSuccess: (data, variables) => {
      console.log("✅ Bookmark mutation succeeded. Data:", data);
      // Update with server response for individual bookmark
      queryClient.setQueryData(["userBookmark", variables.newsItemId, variables.userId], data);
      
      // Invalidate and refetch the full bookmarks list to ensure consistency with server
      // This will fetch the complete nested data structure with news_items
      console.log("🔄 Invalidating userBookmarks cache for userId:", variables.userId);
      queryClient.invalidateQueries({ queryKey: ["userBookmarks", variables.userId] });
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
