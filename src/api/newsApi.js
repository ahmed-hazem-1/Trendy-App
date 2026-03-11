import { supabase } from "../lib/supabaseClient";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Batch-fetch verdicts for a list of news items and attach them.
 * Works without a FK between news_items and verdicts.
 * Optionally accepts a pre-fetched verdictMap to avoid a redundant query.
 */
async function attachVerdicts(newsItems, existingVerdictMap) {
  if (!newsItems?.length) return newsItems || [];

  let verdictMap = existingVerdictMap;

  if (!verdictMap) {
    // Only fetch verdicts for the items in this page (targeted, not full-table)
    const ids = newsItems.map((n) => Number(n.id));
    const { data: verdicts, error } = await supabase
      .from("verdicts")
      .select("news_id, verdict, confidence, reasoning, sources_used")
      .in("news_id", ids);

    if (error) {
      console.warn("Failed to fetch verdicts:", error.message);
      return newsItems;
    }

    verdictMap = new Map();
    (verdicts || []).forEach((v) => verdictMap.set(Number(v.news_id), v));
  }

  return newsItems.map((item) => ({
    ...item,
    verdicts: verdictMap.get(Number(item.id)) || null,
  }));
}

/**
 * Targeted verdict pre-fetch for filtering.
 * - "ALL": no pre-fetch needed; verdicts attached after page fetch.
 * - "UNVERIFIED": fetch only news_ids that have verdicts (to exclude them).
 * - "TRUE"/"FALSE"/"MISLEADING": fetch only matching verdicts.
 */
async function prefetchVerdicts(verificationStatus) {
  const needsFilter = verificationStatus && verificationStatus !== "ALL";

  if (!needsFilter) {
    // Skip heavy full-table scan — verdicts will be batch-attached per page.
    return { filter: null, verdictMap: null };
  }

  const upper = verificationStatus.toUpperCase();

  if (upper === "UNVERIFIED") {
    // Only need IDs (minimal columns) to build the exclusion list.
    const { data: verdictIds, error } = await supabase
      .from("verdicts")
      .select("news_id");

    if (error) {
      console.warn("Failed to fetch verdict IDs:", error.message);
      return { filter: null, verdictMap: null };
    }

    const ids = (verdictIds || []).map((v) => Number(v.news_id));
    return { filter: { mode: "exclude", ids }, verdictMap: null };
  }

  // For TRUE / FALSE / MISLEADING — only fetch matching verdicts
  const { data: matchingVerdicts, error } = await supabase
    .from("verdicts")
    .select("news_id, verdict, confidence, reasoning, sources_used")
    .eq("verdict", upper);

  if (error) {
    console.warn("Failed to fetch verdicts:", error.message);
    return { filter: null, verdictMap: null };
  }

  const verdictMap = new Map();
  const matchingIds = [];
  (matchingVerdicts || []).forEach((v) => {
    const nid = Number(v.news_id);
    verdictMap.set(nid, v);
    matchingIds.push(nid);
  });

  return { filter: { mode: "include", ids: matchingIds }, verdictMap };
}

// ─────────────────────────────────────────────
// News Items
// ─────────────────────────────────────────────

/**
 * Fetch paginated news items with related data.
 * Supports filtering by verification_status and category.
 */
export async function fetchNewsItems({
  page = 1,
  pageSize = 10,
  verificationStatus,
  categorySlug,
} = {}) {
  // Targeted verdict fetch — only queries when a specific filter is active
  const { filter: verdictFilter, verdictMap } =
    await prefetchVerdicts(verificationStatus);

  // When filtering by category, use !inner joins so rows without that category are excluded
  const hasCategoryFilter = categorySlug && categorySlug !== "all";
  const newsCategories = hasCategoryFilter
    ? "news_categories!inner ( *, categories!inner (*) )"
    : "news_categories ( *, categories (*) )";

  let query = supabase
    .from("news_items")
    .select(
      `
      id, title, content, verification_status, credibility_score,
      ingested_at, published_at,
      ${newsCategories},
      evidence_items!evidence_items_news_id_fkey (id, url, title, snippet, source_type)
    `,
      { count: "exact" },
    )
    .order("ingested_at", { ascending: false });

  if (hasCategoryFilter) {
    query = query.eq("news_categories.categories.slug", categorySlug);
  }

  // Apply server-side verdict filter
  if (verdictFilter) {
    if (verdictFilter.mode === "include") {
      if (verdictFilter.ids.length === 0) {
        // No matching verdicts → return empty immediately
        return { data: [], count: 0, page, pageSize };
      }
      query = query.in("id", verdictFilter.ids);
    } else if (
      verdictFilter.mode === "exclude" &&
      verdictFilter.ids.length > 0
    ) {
      // UNVERIFIED: exclude items that have verdicts
      query = query.not("id", "in", `(${verdictFilter.ids.join(",")})`);
    }
  }

  // Apply pagination after all filters
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  // Attach verdict data — reuse the already-fetched verdictMap (no extra query)
  const merged = await attachVerdicts(data, verdictMap);

  return { data: merged, count, page, pageSize };
}

/**
 * Fetch a single news item by ID with all related data.
 */
export async function fetchNewsItemById(id) {
  const { data, error } = await supabase
    .from("news_items")
    .select(
      `
      *,
      ingestion_sources (*),
      news_categories (
        *,
        categories (*)
      ),
      evidence_items!evidence_items_news_id_fkey (*),
      verification_log (*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  // Fetch verdict separately (no FK constraint)
  const { data: verdictData } = await supabase
    .from("verdicts")
    .select("*")
    .eq("news_id", id)
    .maybeSingle();

  return { ...data, verdicts: verdictData || null };
}

/**
 * Fetch trending news items.
 */
export async function fetchTrendingNews(limit = 5) {
  const { data, error } = await supabase
    .from("news_items")
    .select(
      `
      id, title, verification_status, credibility_score, ingested_at,
      news_categories (
        categories (name, slug)
      )
    `,
    )
    .eq("is_trending", true)
    .order("ingested_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return await attachVerdicts(data);
}

// ─────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────

/**
 * Fetch all active categories.
 */
export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────
// Reactions
// ─────────────────────────────────────────────

/**
 * Get reaction counts for a news item.
 */
export async function fetchReactionCounts(newsItemId) {
  const { data, error } = await supabase
    .from("news_reactions")
    .select("reaction_type")
    .eq("news_item_id", newsItemId);

  if (error) throw error;

  const counts = { EXCITED: 0, NEUTRAL: 0, SKEPTICAL: 0, ANGRY: 0 };
  data.forEach((r) => {
    if (counts[r.reaction_type] !== undefined) counts[r.reaction_type]++;
  });
  return counts;
}

/**
 * Batch-fetch reaction counts for multiple news items in a single query.
 */
export async function fetchBatchReactionCounts(newsItemIds) {
  if (!newsItemIds?.length) return {};

  const { data, error } = await supabase
    .from("news_reactions")
    .select("news_item_id, reaction_type")
    .in("news_item_id", newsItemIds);

  if (error) throw error;

  const result = {};
  newsItemIds.forEach((id) => {
    result[id] = { EXCITED: 0, NEUTRAL: 0, SKEPTICAL: 0, ANGRY: 0 };
  });
  (data || []).forEach((r) => {
    if (result[r.news_item_id]) {
      result[r.news_item_id][r.reaction_type] =
        (result[r.news_item_id][r.reaction_type] || 0) + 1;
    }
  });
  return result;
}

/**
 * Batch-fetch user reactions for multiple news items in a single query.
 */
export async function fetchBatchUserReactions(newsItemIds, userId) {
  if (!newsItemIds?.length || !userId) return {};

  const { data, error } = await supabase
    .from("news_reactions")
    .select("news_item_id, reaction_type")
    .in("news_item_id", newsItemIds)
    .eq("user_id", userId);

  if (error) throw error;

  const result = {};
  (data || []).forEach((r) => {
    result[r.news_item_id] = r;
  });
  return result;
}

/**
 * Get the current user's reaction for a news item.
 */
export async function fetchUserReaction(newsItemId, userId) {
  const { data, error } = await supabase
    .from("news_reactions")
    .select("*")
    .eq("news_item_id", newsItemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Add or update a reaction on a news item.
 */
export async function upsertReaction({ newsItemId, userId, reactionType }) {
  // Remove existing reaction first
  await supabase
    .from("news_reactions")
    .delete()
    .eq("news_item_id", newsItemId)
    .eq("user_id", userId);

  // Insert new reaction
  const { data, error } = await supabase
    .from("news_reactions")
    .insert({
      news_item_id: newsItemId,
      user_id: userId,
      reaction_type: reactionType,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove a reaction from a news item.
 */
export async function removeReaction({ newsItemId, userId }) {
  const { error } = await supabase
    .from("news_reactions")
    .delete()
    .eq("news_item_id", newsItemId)
    .eq("user_id", userId);

  if (error) throw error;
}

// ─────────────────────────────────────────────
// Bookmarks
// ─────────────────────────────────────────────

/**
 * Check if a news item is bookmarked by the user.
 */
export async function fetchUserBookmark(newsItemId, userId) {
  const { data, error } = await supabase
    .from("user_bookmarks")
    .select("*")
    .eq("news_item_id", newsItemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Toggle bookmark for a news item.
 */
export async function toggleBookmark({ newsItemId, userId, note }) {
  const existing = await fetchUserBookmark(newsItemId, userId);

  if (existing) {
    const { error } = await supabase
      .from("user_bookmarks")
      .delete()
      .eq("id", existing.id);
    if (error) throw error;
    return null; // removed
  }

  const { data, error } = await supabase
    .from("user_bookmarks")
    .insert({ news_item_id: newsItemId, user_id: userId, note })
    .select()
    .single();

  if (error) throw error;
  return data; // added
}

/**
 * Fetch all bookmarks for a user.
 */
export async function fetchUserBookmarks(userId) {
  const { data, error } = await supabase
    .from("user_bookmarks")
    .select(
      `
      *,
      news_items (
        id, title, verification_status, credibility_score, ingested_at,
        news_categories (
          categories (name, slug)
        )
      )
    `,
    )
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

/**
 * Fetch notifications for a user.
 */
export async function fetchNotifications(userId, { limit = 20 } = {}) {
  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      *,
      news_items (id, title)
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Get unread notification count.
 */
export async function fetchUnreadNotificationCount(userId) {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
  return count || 0;
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(notificationId) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}

// ─────────────────────────────────────────────
// Search (via Axios for flexibility)
// ─────────────────────────────────────────────

/**
 * Search news items by title text.
 */
export async function searchNews(
  query,
  { limit = 20, verificationStatus, categorySlug } = {},
) {
  // Targeted verdict fetch for search filtering
  const { filter: verdictFilter, verdictMap } =
    await prefetchVerdicts(verificationStatus);

  // Double-quote the pattern so PostgREST parses Unicode / special chars correctly
  const escaped = query.replace(/"/g, '""');
  const pattern = `"%${escaped}%"`;

  const hasCategoryFilter = categorySlug && categorySlug !== "all";
  const newsCategories = hasCategoryFilter
    ? "news_categories!inner ( *, categories!inner (*) )"
    : "news_categories ( *, categories (*) )";

  let q = supabase
    .from("news_items")
    .select(
      `
      id, title, content, verification_status, credibility_score,
      ingested_at, published_at,
      ${newsCategories},
      evidence_items!evidence_items_news_id_fkey (id, url, title, snippet, source_type)
    `,
    )
    .or(`title.ilike.${pattern},content.ilike.${pattern}`)
    .order("ingested_at", { ascending: false });

  if (hasCategoryFilter) {
    q = q.eq("news_categories.categories.slug", categorySlug);
  }

  // Apply server-side verdict filter
  if (verdictFilter) {
    if (verdictFilter.mode === "include") {
      if (verdictFilter.ids.length === 0) {
        return { data: [], count: 0 };
      }
      q = q.in("id", verdictFilter.ids);
    } else if (
      verdictFilter.mode === "exclude" &&
      verdictFilter.ids.length > 0
    ) {
      q = q.not("id", "in", `(${verdictFilter.ids.join(",")})`);
    }
  }

  q = q.limit(limit);

  const { data, error } = await q;
  if (error) throw error;

  // Attach verdict data — reuse the already-fetched verdictMap (no extra query)
  const merged = await attachVerdicts(data, verdictMap);

  return { data: merged, count: merged?.length ?? 0 };
}
