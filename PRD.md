# Trendy — Product Requirements Document (PRD)

> **Version:** 1.0 · **Date:** March 11, 2026 · **Language:** Arabic (RTL)  
> **Target Market:** Egypt / Arabic-speaking users

---

## 1. Product Summary

**Trendy** is an AI-powered news fact-checking and verification platform targeting Arabic-speaking users — primarily Egypt. It allows users to browse, filter, and read news items that have been automatically assessed by an AI pipeline and assigned one of four verdicts: **VERIFIED** (TRUE in database), **FAKE** (FALSE in database), **MISLEADING**, or **UNVERIFIED**.

Users can react to news stories, bookmark articles, receive notifications, and manage their personal profile. A **Demo Mode** lets visitors experience the feed without creating an account.

---

## 2. Core Goal

> "Your trusted source for real-time news verification using Artificial Intelligence."  
> — `مصدرك الموثوق للتحقق من الأخبار في الوقت الفعلي باستخدام الذكاء الاصطناعي`

---

## 3. Tech Stack

### Frontend
| Layer | Library / Tool | Version |
|---|---|---|
| Framework | React | 19.x |
| Build Tool | Vite | 7.x |
| Routing | React Router DOM | 7.x |
| State Management | Redux Toolkit + React Redux | 2.x / 9.x |
| Server State & Cache | TanStack React Query | 5.x |
| Form Management | React Hook Form | 7.x |
| HTTP Client | Axios | 1.x |
| Icons | Lucide React | 0.575.x |
| Styling | Tailwind CSS | 4.x |
| Linting | ESLint | 9.x |

### Backend / Infrastructure
| Layer | Service |
|---|---|
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (email/password + email confirmation) |
| Realtime | Supabase (used indirectly via `onAuthStateChange`) |
| Hosting | Netlify (inferred from `public/_redirects`) |

---

## 4. Application Routes

```
/                   → Redirects to /login
/login              → Login page (public)
/signup             → Sign-up page (public)
/auth/callback      → Email confirmation handler (public)
/feed               → News feed (protected; demo mode allowed)
/profile/:id        → User profile (protected; demo mode blocked)
/posts/:id          → News item detail (protected)
```

---

## 5. Pages — Count & Content

### 5.1 Login (`/login`)
**Purpose:** Authenticate existing users.

**Content:**
- Trendy logo
- Email + password input fields (with validation)
- "Sign in" submit button with loading state
- "Continue as Demo" guest button — bypasses authentication and allows read-only feed access via Redux `isDemoMode` flag
- Link to `/signup`
- Arabic error messages for invalid credentials, unconfirmed email, etc.

**Logic:**
- Uses `react-hook-form` for client-side validation
- On success → dispatches `setUser` to Redux and navigates to `/feed` (or the originally intended route via React Router `location.state.from`)
- Sets `setDemoMode(true)` in Redux when demo is chosen, skipping all API auth calls

---

### 5.2 Sign Up (`/signup`)
**Purpose:** Register new users.

**Content:**
- Full name, email, password, Egyptian phone number (with `+20` prefix), governorate selector (27 Egyptian governorates from `EGYPT_GOVERNORATES` constant)
- Validation rules: name ≥ 3 chars, valid email, password ≥ 6 chars, Egyptian mobile pattern `1[0125]\d{8}`
- Success message with redirect to `/login` after 3 seconds

**Logic:**
- Calls Supabase `auth.signUp()`, then upserts a row into `public.users` with role `USER` and status `PENDING_VERIFICATION`
- Always forces email confirmation: even if Supabase auto-confirms, the app calls `signOut()` immediately to enforce the email verification flow
- Redirects to `/login` after success — the user must click the email confirmation link before they can authenticate

---

### 5.3 Feed (`/feed`)
**Purpose:** Main content stream — the app's primary screen.

**Content:**

| Section | Description |
|---|---|
| **Left Sidebar** (desktop) | Category navigation (`UserSidebar`) — filters news by topic |
| **Right Sidebar** (desktop) | Trending news panel (`TrendingSidebar`) — top 5 trending items |
| **Main Column** | Paginated list of `NewsCard` components |
| **Filter Tabs** | Verification status tabs: All / Verified (متحقق) / Fake (مزيف) / Misleading (مضلل) / Unverified (غير متحقق) |
| **Mobile Sidebar** | Drawer overlay (same category list, toggled by navbar burger) |

**Each `NewsCard` shows:**
- Headline and snippet
- Verification status badge (color-coded)
- Credibility score
- Time since ingestion (Arabic relative time: منذ X دقيقة / ساعة / يوم)
- Category label
- Reaction counts (EXCITED, NEUTRAL, SKEPTICAL)
- Share button → opens `ShareModal`

**Logic:**
- Filter state is stored in URL query params (`?filter=TRUE&category=sports&q=search-term`) — shareable and browser-back-button safe
- Infinite scroll using `IntersectionObserver` — fetches next page when a sentinel `<div>` enters the viewport (200 px margin)
- Reaction counts are batch-fetched in a **single query** for all visible cards to avoid N+1 requests
- `useTrendingNews(5)` populates the right sidebar

---

### 5.4 Profile (`/profile/:id`)
**Purpose:** View and edit the authenticated user's personal data.

**Content:**
- Avatar display (falls back to logo)
- Editable fields: full name, email, Egyptian phone, governorate
- Bio text area with inline edit/save
- Interest tags grid (10 categories: Technology, Politics, Sports, Society, Economy, Health, Science, Entertainment, Education, Environment) — selectable multi-choice
- Ad placements: `AdCard`, `PremiumBanner`, `MobileAdStrip` (from mock ad data)

**Logic:**
- Profile data sourced from `public.users` via Redux `state.auth.profile`
- Saves changes by calling `updateUserProfile()` (Supabase `.update()` on `users` table) then calls `refreshProfile()` to re-hydrate Redux
- Bio saves independently from main form (separate "Save Bio" button)
- Interests managed in local state (not persisted to DB yet)

---

### 5.5 Posts (`/posts/:id`)
**Purpose:** Full detail view of a single news item.

**Content:**
- Full article title, content, source link
- Publication timestamp (formatted Arabic date)
- Category tag
- **Verification verdict panel** — large status badge + AI reasoning text
- **Credibility score bar** — colour-coded (green ≥70, amber ≥40, red <40) with label: ثقة عالية / متوسطة / منخفضة
- **Sources used** by the AI during verification
- **Evidence items** — list of supporting URLs with titles and snippets
- **Verification log** — step-by-step AI processing steps
- **Reaction bar** — user can select EXCITED / NEUTRAL / SKEPTICAL; toggling removes own reaction
- **Share button** → `ShareModal`
- Ad placements

**Logic:**
- Fetches single item via `useNewsItem(id)` which uses `fetchNewsItemById` — joins `ingestion_sources`, `news_categories`, `evidence_items`, `verification_log`, and fetches `verdicts` separately (no FK)
- Reaction mutations use `useReactToNews()` / `useRemoveReaction()` which call Supabase upsert/delete on `news_reactions`
- Optimistic updates are handled by React Query's `queryClient.invalidateQueries` after mutation

---

### 5.6 Auth Callback (`/auth/callback`)
**Purpose:** Handle Supabase email confirmation redirect. Not a visible page (shows SplashScreen while processing).

**Logic:**
1. Supabase auto-exchanges the URL fragment tokens (PKCE) into a session via `detectSessionInUrl: true`
2. Component checks for an active session; if found → navigates to `/feed`
3. If not immediately available → subscribes to `onAuthStateChange` and waits for `SIGNED_IN` event
4. Safety timeout of 10 seconds → fallback redirect to `/login`

---

## 6. API Connections

### 6.1 Supabase Client (`supabaseClient.js`)
Single shared instance. Configuration:
- `autoRefreshToken: true`
- `persistSession: true`
- `detectSessionInUrl: true` (handles email confirmation tokens)
- `flowType: "pkce"` (PKCE flow for enhanced security)
- `storageKey: "sb-trendy-auth-token"` (custom localStorage key)
- `lock: (_name, _acquireTimeout, fn) => fn()` — **bypasses Navigator LockManager** to prevent deadlocks during `getSession()` and `signInWithPassword()` calls (especially on page refresh or in React StrictMode)

**One client only** — creating multiple instances causes session contention. The lock bypass eliminates deadlocks that previously caused infinite loading states.

---

### 6.2 Auth API (`authApi.js`)

| Function | Method | Description |
|---|---|---|
| `signUp()` | `supabase.auth.signUp()` + `users.upsert()` | Creates auth user + inserts `public.users` profile row |
| `signIn()` | `supabase.auth.signInWithPassword()` + `users.update()` | Logs in user, updates `last_login_at` |
| `signOut()` | `supabase.auth.signOut()` | Clears session |
| `getSession()` | `supabase.auth.getSession()` | Returns current session or null |
| `getUserProfile(userId)` | `users.select()` | Fetches `public.users` row by `uuid` |
| `ensureUserProfile(authUser)` | `getUserProfile` + auto-create fallback | Returns profile or creates it from auth metadata |
| `updateUserProfile(id, data)` | `users.update()` | Patches profile fields |

---

### 6.3 News API (`newsApi.js`)

| Function | Supabase Tables | Description |
|---|---|---|
| `fetchNewsItems()` | `news_items`, `news_categories`, `categories`, `evidence_items` | Paginated feed with optional verdict/category filters |
| `fetchNewsItemById(id)` | `news_items`, `ingestion_sources`, `news_categories`, `evidence_items`, `verification_log`, `verdicts` | Full detail row for a single item |
| `fetchTrendingNews(limit)` | `news_items` (`is_trending = true`) | Top N trending items |
| `fetchCategories()` | `categories` | All active categories ordered by `display_order` |
| `fetchReactionCounts(newsItemId)` | `news_reactions` | Per-item reaction breakdown |
| `fetchBatchReactionCounts(ids)` | `news_reactions` | Bulk reaction counts for many items (1 query) |
| `fetchBatchUserReactions(ids, userId)` | `news_reactions` | User's reactions for many items (1 query) |
| `fetchUserReaction(newsItemId, userId)` | `news_reactions` | Single user reaction for one item |
| `upsertReaction(newsItemId, userId, type)` | `news_reactions` | Add or update a reaction |
| `removeReaction(newsItemId, userId)` | `news_reactions` | Delete a reaction |
| `toggleBookmark(newsItemId, userId)` | `bookmarks` | Add or remove bookmark |
| `fetchUserBookmarks(userId)` | `bookmarks` | Get all bookmarks for a user |
| `fetchNotifications(userId)` | `notifications` | Get user notifications |
| `fetchUnreadNotificationCount(userId)` | `notifications` | Count of unread notifications |
| `markNotificationRead(id)` | `notifications` | Mark one notification read |
| `markAllNotificationsRead(userId)` | `notifications` | Mark all notifications read |
| `searchNews(term, options)` | `news_items` (full-text) | Search with optional filter/category |

---

### 6.4 Axios Instance (`axiosInstance.js`)
Pre-configured Axios client pointing at `VITE_SUPABASE_URL/rest/v1` with:
- `apikey` header (anon key from env)
- **Request interceptor** — injects `Authorization: Bearer <access_token>` from current Supabase session on every request
- **Response interceptor** — on 401, attempts `supabase.auth.refreshSession()`; if that fails, calls `signOut()`

---

## 7. Database Schema (Tables Referenced)

| Table | Purpose |
|---|---|
| `auth.users` | Supabase internal auth users |
| `public.users` | Extended user profile (full_name, phone, location, role, status, bio, avatar_url, etc.) |
| `news_items` | Core news articles (title, content, url, verification_status, credibility_score, is_trending, ingested_at, published_at) |
| `verdicts` | AI-generated verdicts per news item (verdict, confidence, reasoning, sources_used) |
| `categories` | News categories (name, slug, display_order, is_active) |
| `news_categories` | Join table: news items ↔ categories |
| `evidence_items` | Supporting evidence URLs per news item |
| `ingestion_sources` | Source metadata for ingested news |
| `verification_log` | Step-by-step audit trail of AI verification process |
| `news_reactions` | User reactions per news item (EXCITED / NEUTRAL / SKEPTICAL / ANGRY) |
| `bookmarks` | User bookmarked news items |
| `notifications` | In-app notifications per user |

---

## 8. State Management Architecture

### Redux Store (`store.js`)
Single reducer: `auth`

```
state.auth = {
  user: <Supabase Auth User>,
  profile: <public.users row>,
  isAuthenticated: boolean,
  isDemoMode: boolean,
  isLoading: boolean
}
```

**Actions:**
- `setUser({ user, profile })` — hydrates both auth user and profile
- `setProfile(profile)` — updates profile only
- `clearAuth()` — resets on logout
- `setDemoMode(boolean)` — enables guest browsing mode
- `setLoading(boolean)` — controls splash screen visibility

### React Query Cache
All server data (news, reactions, notifications, categories) is managed via TanStack Query:
- `staleTime` — 2 minutes for news / 1 minute for search
- `keepPreviousData` — no flash between filter changes
- Batch queries prevent N+1 problems on the feed page
- `invalidateQueries` after mutations to keep data fresh

---

## 9. Core Logic Flows

### 9.1 Authentication Bootstrap
```
App mounts
  └─ useAuthListener() (runs ONCE)
       ├─ supabase.auth.getSession()
       │    ├─ Session found → ensureUserProfile() → dispatch setUser()
       │    │     └─ If status is PENDING_VERIFICATION → promote to ACTIVE
       │    └─ No session → dispatch clearAuth()
       └─ supabase.auth.onAuthStateChange()
            ├─ SIGNED_IN  → fetch/create profile → dispatch setUser()
            ├─ SIGNED_OUT → dispatch clearAuth()
            └─ TOKEN_REFRESHED → update user in Redux (keep existing profile)
```

### 9.2 News Feed Filtering
```
URL params drive all filter state:
  ?filter=TRUE&category=sports&q=search-term

FilterTabs → navigate("?filter=X")
UserSidebar → navigate("?category=X")
SearchBar → navigate("?q=term")

useNewsItems({ verificationStatus, categorySlug, searchTerm })
  └─ if searchTerm ≥ 2 chars → searchNews()
  └─ else → fetchNewsItems() with cursor-based pagination
```

### 9.3 Infinite Scroll
```
IntersectionObserver watches a sentinel <div> at the bottom of the list
  └─ On intersect → fetchNextPage() (if hasNextPage && !isFetchingNextPage)
  └─ useEffect re-checks bounds when items.length changes
     (handles case where sentinel never left viewport)
```

### 9.4 Verdict Filtering (Server-side optimisation)
```
Frontend filter keys: VERIFIED, FAKE, MISLEADING, UNVERIFIED, ALL
Database verdict values: TRUE/VERIFIED, FALSE/FAKE, MISLEADING

VERDICT_ALIASES maps frontend keys to DB values:
  VERIFIED → ["VERIFIED", "TRUE"]
  FAKE → ["FAKE", "FALSE"]
  MISLEADING → ["MISLEADING"]

verificationStatus = VERIFIED / FAKE / MISLEADING
  └─ prefetchVerdicts() queries verdicts table with .in("verdict", aliases)
  └─ fetchNewsItems() runs .in("id", matchingIds) → only matching articles returned

verificationStatus = UNVERIFIED
  └─ prefetchVerdicts() fetches ALL verdict news_ids
  └─ fetchNewsItems() runs .not("id", "in", verdictIds) → items WITHOUT verdicts

verificationStatus = ALL
  └─ No pre-fetch → verdicts attached per page via attachVerdicts()

IMPORTANT: Filtering on news_items.verification_status column directly does NOT
work because verified items keep the default UNVERIFIED status in that column —
the actual verdict lives in the verdicts table. Always use prefetchVerdicts().
```

### 9.5 Reaction Toggle
```
User clicks reaction button
  └─ if same reaction already active → removeReaction() (DELETE)
  └─ if different or no reaction → upsertReaction() (UPSERT)
  └─ on success → invalidateQueries(["reactionCounts", id])
                → invalidateQueries(["userReaction", id])
```

### 9.6 Route Protection
```
ProtectedRoute checks Redux state:
  ├─ isLoading === true → <SplashScreen />
  ├─ isAuthenticated === true → render children
  ├─ isDemoMode === true AND allowDemo prop === true → render children
  └─ else → <Navigate to="/login" state={{ from: location }} />
```

---

## 10. Component Architecture

```
App.jsx
├─ SplashScreen (Suspense fallback)
├─ Login / Signup (AuthLayout wrapper)
├─ AuthCallback
└─ AppLayout
     ├─ NavBar
     │    ├─ SearchBar
     │    ├─ NotificationBell
     │    └─ UserMenu
     ├─ Feed
     │    ├─ MobileSidebar (drawer)
     │    ├─ UserSidebar (category nav)
     │    ├─ FilterTabs
     │    ├─ NewsCard[]
     │    │    └─ StatusBadge, ShareModal
     │    └─ TrendingSidebar
     ├─ Profile
     │    ├─ MobileSidebar
     │    └─ Ads (AdCard, PremiumBanner, MobileAdStrip)
     └─ Posts
          ├─ MobileSidebar
          ├─ StatusBadge
          ├─ ShareModal
          └─ Ads
```

---

## 11. Key Design Decisions

| Decision | Rationale |
|---|---|
| Single Supabase client with lock bypass | Prevents `NavigatorLockManager` deadlocks during `getSession()` and `signInWithPassword()` calls by bypassing the lock mechanism entirely (`lock: (_name, _acquireTimeout, fn) => fn()`). Sessions still persist via localStorage; the lock was only needed for cross-tab coordination. This fix eliminates the infinite loading spinner on page refresh. |
| Auth listener only in `App.jsx` | Prevents duplicate `onAuthStateChange` subscriptions causing ghost SIGNED_IN events during signup |
| URL-based filter state | Filters are shareable, bookmarkable, and survive page refresh without extra persistence logic |
| Verdict-based filtering (not column-based) | The `news_items.verification_status` column is not reliable for filtering because verified items retain the default UNVERIFIED value. The actual verdict lives in the `verdicts` table. `prefetchVerdicts()` queries that table first, then filters `news_items` by matching IDs. This is the ONLY correct way to filter by verdict. |
| Batch reaction queries | A single `SELECT ... IN (ids)` replaces N individual queries on the feed page — critical for performance |
| Demo mode in Redux | Allows unauthenticated users to access `/feed` without any API auth calls, with a clean permission layer in `ProtectedRoute` |
| Force email confirmation | Even when Supabase auto-confirms (dashboard setting), the app signs out immediately post-signup to ensure all users go through email verification |
| `keepPreviousData` in React Query | Prevents feed from flashing empty while switching filters |

---

## 12. Environment Variables

```env
VITE_SUPABASE_URL=             # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY= # Supabase anon/publishable key
```

---

## 13. Build & Run

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

---

*Document generated from source code analysis — March 11, 2026*
