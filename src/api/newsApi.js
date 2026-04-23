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

// ─────────────────────────────────────────────
// News Items
// ─────────────────────────────────────────────

/**
 * Map frontend filter keys to the verdict values stored in the DB.
 * The verdicts table may use TRUE/FALSE or VERIFIED/FAKE — we accept both.
 */
const VERDICT_ALIASES = {
  VERIFIED: ["VERIFIED", "TRUE"],
  FAKE: ["FAKE", "FALSE"],
};

/**
 * Pre-fetch verdict IDs for server-side filtering (see PRD §9.4).
 *
 * - Specific status (VERIFIED, FAKE): fetch matching verdict
 *   news_ids → mode "include" (only show those items).
 * - UNVERIFIED: fetch ALL verdict news_ids → mode "exclude" (show items
 *   that have no verdict).
 */
// ─────────────────────────────────────────────
// Verdict Cache — prevents duplicate queries
// ─────────────────────────────────────────────
const verdictCache = new Map();

/**
 * Preload and cache verdicts for a specific verification status.
 * Results are cached for 5 minutes to avoid redundant queries.
 * If cache is stale or missing, fetches fresh data with retries.
 */
async function prefetchVerdicts(verificationStatus) {
  if (!verificationStatus || verificationStatus === "ALL") {
    return { filter: null, verdictMap: null };
  }

  // Check if we have cached verdicts (less than 5 minutes old)
  const cached = verdictCache.get(verificationStatus);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.data;
  }

  // Fetch verdicts with retry logic
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await _fetchVerdictsWithRetry(verificationStatus);
      // Cache the result
      verdictCache.set(verificationStatus, {
        data: result,
        timestamp: Date.now(),
      });
      return result;
    } catch (err) {
      lastError = err;
      console.error(`[prefetchVerdicts] Attempt ${attempt + 1} failed:`, err);
      if (attempt < 2) {
        // Exponential backoff before retry
        const delay = Math.min(100 * Math.pow(2, attempt), 1000);
        await new Promise((resolve) =>
          setTimeout(resolve, delay),
        );
      }
    }
  }

  console.error(
    `[prefetchVerdicts] Failed after 3 retries for ${verificationStatus}:`,
    lastError?.message,
    lastError?.code,
    lastError?.details,
  );
  return { filter: null, verdictMap: null };
}

/**
 * Internal helper to fetch verdicts (single attempt, no retry).
 */
async function _fetchVerdictsWithRetry(verificationStatus) {
  const upperStatus = verificationStatus.toUpperCase();

  if (upperStatus === "UNVERIFIED") {
    const { data: verdicts, error } = await supabase
      .from("verdicts")
      .select("news_id, verdict, confidence, reasoning, sources_used");

    if (error) {
      console.error("[_fetchVerdictsWithRetry] Error querying verdicts:", error);
      throw error;
    }

    const verdictMap = new Map();
    const ids = [];
    (verdicts || []).forEach((v) => {
      verdictMap.set(Number(v.news_id), v);
      ids.push(Number(v.news_id));
    });

    return { filter: { mode: "exclude", ids }, verdictMap };
  }

  // Specific status — may map to multiple DB values (e.g. VERIFIED → VERIFIED | TRUE)
  const aliases = VERDICT_ALIASES[upperStatus] || [upperStatus];

  let q = supabase
    .from("verdicts")
    .select("news_id, verdict, confidence, reasoning, sources_used");

  if (aliases.length === 1) {
    q = q.eq("verdict", aliases[0]);
  } else {
    q = q.in("verdict", aliases);
  }

  const { data: verdicts, error } = await q;

  if (error) {
    console.error(`[_fetchVerdictsWithRetry] Error querying ${upperStatus}:`, error);
    throw error;
  }

  const verdictMap = new Map();
  const ids = [];
  (verdicts || []).forEach((v) => {
    verdictMap.set(Number(v.news_id), v);
    ids.push(Number(v.news_id));
  });

  return { filter: { mode: "include", ids }, verdictMap };
}

/**
 * Global cache for all active categories to prevent multiple concurrent queries
 */
let globalCategoriesCache = null;
let lastCategoryFetchTime = 0;

/**
 * Fetch all categories once and find IDs in memory
 */
async function getAllCategoriesMap() {
  const now = Date.now();
  // Cache for 30 minutes
  if (globalCategoriesCache && now - lastCategoryFetchTime < 30 * 60 * 1000) {
    return globalCategoriesCache;
  }

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug")
      .eq("is_active", true);

    if (error) throw error;
    
    const catMap = new Map();
    (data || []).forEach(c => catMap.set(c.slug, c.id));
    
    globalCategoriesCache = catMap;
    lastCategoryFetchTime = now;
    return catMap;
  } catch (err) {
    console.error("Failed to fetch global categories:", err);
    return new Map();
  }
}

/**
 * Fetch paginated news items with related data.
 * Supports filtering by verification_status (via verdicts table) and category.
 */
export async function fetchNewsItems({
  page = 1,
  pageSize = 10,
  verificationStatus,
  categorySlug,
  categorySlugs,
} = {}) {
  try {
    // Pre-fetch verdict IDs for filtering (PRD §9.4)
    const { filter: verdictFilter, verdictMap } =
      await prefetchVerdicts(verificationStatus);

    let query = supabase
      .from("news_items")
      .select(
        `
        id, title, content, verification_status, verification_number, credibility_score,
        ingested_at, published_at, image_link,
        categories (name, slug)
      `,
        { count: "exact" },
      )
      .order("ingested_at", { ascending: false });

    const allCatsMap = await getAllCategoriesMap();

    // Category filtering (slug or list) - filter by category_id directly
    if (categorySlug && categorySlug !== "all") {
      if (categorySlug === "other") {
        query = query.is("category_id", null);
      } else {
        const categoryId = categorySlug === "economy" ? null : allCatsMap.get(categorySlug);
        if (categoryId != null) {
          query = query.eq("category_id", categoryId);
        } else {
          // If category not found, return empty results instead of showing all
          return { data: [], count: 0, page, pageSize };
        }
      }
    } else if (categorySlugs && categorySlugs.length > 0) {
      // Fetch all category IDs for multiple filters from cache
      const validIds = categorySlugs
        .filter(slug => slug !== "economy")
        .map(slug => allCatsMap.get(slug))
        .filter(id => id != null);
        
      if (validIds.length > 0) {
        query = query.in("category_id", validIds);
      } else {
        // If no valid categories found, return empty results
        return { data: [], count: 0, page, pageSize };
      }
    } else {
      // Always exclude economy by default if no specific category is requested
      const economyId = allCatsMap.get("economy");
      if (economyId != null) {
        query = query.neq("category_id", economyId);
      }
    }

    // Apply verdict-based filter
    if (verdictFilter) {
      if (verdictFilter.mode === "include") {
        if (verdictFilter.ids.length === 0) {
          return { data: [], count: 0, page, pageSize };
        }
        query = query.in("id", verdictFilter.ids);
      } else if (
        verdictFilter.mode === "exclude" &&
        verdictFilter.ids.length > 0
      ) {
        query = query.not("id", "in", `(${verdictFilter.ids.join(",")})`);
      }
    }

    // Apply pagination after all filters
    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;
    if (error) {
      console.error("fetchNewsItems error:", error.message, error.code);
      throw error;
    }

    // Attach verdict details — reuse the already-fetched verdictMap when available
    const merged = await attachVerdicts(data, verdictMap);

    return { data: merged, count, page, pageSize };
  } catch (err) {
    console.error("fetchNewsItems error:", err);
    throw err; // Re-throw so React Query catches it
  }
}

/**
 * Fetch evidence items for a single news item (lazy — called on demand).
 */
export async function fetchEvidenceItems(newsItemId) {
  const { data, error } = await supabase
    .from("evidence_items")
    .select("id, url, title, snippet, source_type")
    .eq("news_id", newsItemId)
    .order("id", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single news item by ID with all related data.
 */
export async function fetchNewsItemById(id) {
  try {
    // Fetch basic news item data
    const { data, error } = await supabase
      .from("news_items")
      .select(
        `
        id,
        title,
        content,
        url,
        verification_status,
        verification_number,
        credibility_score,
        ingested_at,
        published_at,
        language,
        image_link,
        categories (name, slug)
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching news item:", error);
      throw error;
    }

    // Fetch verdict separately (no FK constraint)
    const { data: verdictData } = await supabase
      .from("verdicts")
      .select("*")
      .eq("news_id", id)
      .maybeSingle();

    // Fetch evidence items
    const { data: evidenceData = [] } = await supabase
      .from("evidence_items")
      .select("*")
      .eq("news_item_id", id);

    // Fetch verification log
    const { data: verificationLogData = [] } = await supabase
      .from("verification_log")
      .select("*")
      .eq("news_item_id", id);

    return {
      ...data,
      verdicts: verdictData || null,
      evidence_items: evidenceData || [],
      verification_log: verificationLogData || [],
    };
  } catch (err) {
    console.error("fetchNewsItemById error:", err);
    throw err;
  }
}

/**
 * Fetch trending news items.
 */
export async function fetchTrendingNews(limit = 5) {
  const { data, error } = await supabase
    .from("news_items")
    .select(
      `
      id, title, verification_status, verification_number, credibility_score, ingested_at, image_link,
      categories (name, slug)
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
    .neq("slug", "economy")
    .order("display_order", { ascending: true });

  if (error) throw error;
  
  // Explicitly add "Other" category to the list for UI display if not in DB
  const hasOther = data.some(cat => cat.slug === 'other' || cat.slug === 'other-category');
  if (!hasOther) {
    return [
      ...data,
      { id: 'other', name: 'أخرى', slug: 'other', is_active: true }
    ];
  }
  
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
  // Check if a reaction already exists for this user and news item
  const existing = await fetchUserReaction(newsItemId, userId);

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("news_reactions")
      .update({ reaction_type: reactionType })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    // Insert new
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
  try {
    const existing = await fetchUserBookmark(newsItemId, userId);
    console.log("Existing bookmark:", existing);

    if (existing) {
      console.log("Deleting bookmark with ID:", existing.id);
      const { error } = await supabase
        .from("user_bookmarks")
        .delete()
        .eq("id", existing.id);
      if (error) {
        console.error("Delete error:", error);
        throw error;
      }
      console.log("✓ Bookmark deleted successfully");
      return null; // removed
    }

    console.log("Adding new bookmark for newsItemId:", newsItemId, "userId:", userId);
    const { data, error } = await supabase
      .from("user_bookmarks")
      .insert({ news_item_id: newsItemId, user_id: userId, note })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      throw error;
    }
    console.log("✓ Bookmark added successfully:", data);
    return data; // added
  } catch (err) {
    console.error("toggleBookmark error:", err);
    throw err;
  }
}

/**
 * Fetch all bookmarks for a user.
 */
export async function fetchUserBookmarks(userId) {
  try {
    console.log("Fetching bookmarks for userId:", userId);
    const { data, error } = await supabase
      .from("user_bookmarks")
      .select(
        `
        id,
        note,
        saved_at,
        news_items (
          id, 
          title, 
          content,
          verification_status, 
          credibility_score, 
          ingested_at,
          published_at,
          categories (name, slug)
        )
      `,
      )
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookmarks:", error);
      throw error;
    }
    console.log("✓ Fetched bookmarks:", data);
    return data;
  } catch (err) {
    console.error("fetchUserBookmarks error:", err);
    throw err;
  }
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
  { limit = 20, verificationStatus, categorySlug, categorySlugs } = {},
) {
  // Targeted verdict fetch for search filtering
  const { filter: verdictFilter, verdictMap } =
    await prefetchVerdicts(verificationStatus);

  // Double-quote the pattern so PostgREST parses Unicode / special chars correctly
  const escaped = query.replace(/"/g, '""');
  const pattern = `"%${escaped}%"`;

  let q = supabase
    .from("news_items")
    .select(
      `
      id, title, content, verification_status, verification_number, credibility_score,
      ingested_at, published_at, image_link,
      categories!inner (*),
      evidence_items!evidence_items_news_id_fkey (id, url, title, snippet, source_type)
    `,
    )
    .or(`title.ilike.${pattern},content.ilike.${pattern}`)
    .order("ingested_at", { ascending: false });

  const allCatsMap = await getAllCategoriesMap();

  // Always exclude economy category posts from search
  const economyId = allCatsMap.get("economy");
  if (economyId != null) {
    q = q.neq("category_id", economyId);
  }

  // Category filtering - filter by category_id directly
  if (categorySlug && categorySlug !== "all") {
    if (categorySlug === "other") {
      q = q.is("category_id", null);
    } else {
      const categoryId = categorySlug === "economy" ? null : allCatsMap.get(categorySlug);
      if (categoryId != null) {
        q = q.eq("category_id", categoryId);
      } else {
        // If category not found, return empty results
        return { data: [], count: 0 };
      }
    }
  } else if (categorySlugs && categorySlugs.length > 0) {
    // Fetch all category IDs for multiple filters from cache
    const validIds = categorySlugs
      .filter(slug => slug !== "economy")
      .map(slug => allCatsMap.get(slug))
      .filter(id => id != null);
      
    if (validIds.length > 0) {
      q = q.in("category_id", validIds);
    } else {
      // If no valid categories found, return empty results
      return { data: [], count: 0 };
    }
  } else {
    // Always exclude economy by default if no specific category is requested
    const defaultEconomyId = allCatsMap.get("economy");
    if (defaultEconomyId != null) {
      q = q.neq("category_id", defaultEconomyId);
    }
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
