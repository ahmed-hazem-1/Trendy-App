# Trendy - AI News Verification Platform

## Project Overview

**Trendy** is a React/Vite/Supabase news verification platform for Arabic-speaking users. It uses AI to fact-check news articles and assigns verdicts: VERIFIED, FAKE, MISLEADING, or UNVERIFIED. Users can browse, react, bookmark, and share news in demo mode or with full authentication.

**Stack**: React 19 + Vite 7 + Supabase + Redux Toolkit + TanStack Query + Tailwind CSS 4

## Architecture

### Component Organization
- `src/pages/`: Route-level components (Feed, Login, Profile, Posts, Saved)  
- `src/features/`: Feature-specific components (feed/NewsCard, feed/FilterTabs)
- `src/UI/`: Reusable primitives (Button, FormInput, NavBar, BottomSheet)
- `src/hooks/`: Custom hooks (useAuth, useNews)
- `src/api/`: API layer (authApi, newsApi, axiosInstance)

### State Management
- **Redux**: Authentication state only (`user`, `profile`, `isDemoMode`, `isAuthenticated`)
- **React Query**: All server data with 2min stale time, `keepPreviousData` for smooth UX
- **URL State**: Filters stored as query params for shareability

## Critical Patterns

### 🚨 Supabase Client (CRITICAL)
```javascript
// NEVER create multiple Supabase clients - causes NavigatorLockManager deadlocks
// Always use the single instance from src/lib/supabaseClient.js
import { supabase } from '../../lib/supabaseClient';
```

### Authentication Bootstrap
- `useAuthListener()` called **exactly once** in App.jsx root
- All other components use `useAuth()` hook (Redux selectors + mutations)
- Demo mode allows `/feed` access without authentication

### Verdict Filtering System
```javascript
// Database verdicts: TRUE/VERIFIED, FALSE/FAKE, MISLEADING
// Frontend filters: VERIFIED, FAKE, MISLEADING, UNVERIFIED, ALL

// ALWAYS use prefetchVerdicts() - news_items.verification_status is unreliable
const VERDICT_ALIASES = {
  VERIFIED: ["VERIFIED", "TRUE"],
  FAKE: ["FAKE", "FALSE"], 
  MISLEADING: ["MISLEADING"]
};
```

### Performance Patterns
- **Batch queries**: Use `useBatchReactionCounts()` to avoid N+1 problems
- **Infinite scroll**: IntersectionObserver with sentinel div, safety checks for empty pages
- **Lazy loading**: Evidence items fetched only when needed

## Code Style

### Component Patterns
```jsx
// All components are functional with hooks
export default function NewsCard({ newsItem, showEvidence = false }) {
  const profile = useSelector(selectProfile);
  const isDemoMode = useSelector(selectIsDemoMode);
  
  // Custom hooks for data fetching
  const { data: reactions } = useReactionCounts(newsItem.id);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Component content */}
    </div>
  );
}
```

### Styling (Tailwind RTL-First)
```css
/* Use logical properties for RTL support */
ps-4    /* padding-inline-start (not pl-4) */
pe-2    /* padding-inline-end (not pr-2) */
inset-s-0  /* logical positioning (not left-0) */

/* Color palette */
teal-600   /* Primary brand color */
red-50/red-200/red-700  /* Error states */
gray-50/gray-200       /* Neutral backgrounds */
```

### Error Handling
```javascript
// User-facing errors in Arabic
try {
  await login(data);
} catch (err) {
  if (err.message === "Invalid login credentials") {
    setErrorMsg("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  } else {
    setErrorMsg(err.message || "حدث خطأ");
  }
}

// API failures: graceful fallbacks with console warnings
const { data, error } = await supabase.from("verdicts").select();
if (error) {
  console.warn("Failed to fetch verdicts:", error.message);
  return fallbackData; // Don't crash the app
}
```

## Database Schema Key Tables

```sql
-- Core entities
news_items (id, title, content, verification_status, credibility_score, is_trending)
verdicts (news_item_id, verdict, confidence, reasoning) -- Separate table!
categories (id, name, slug, display_order)
users (id, full_name, email, phone, governorate, role, status)

-- Relations
news_categories (news_item_id, category_id)
news_reactions (news_item_id, user_id, reaction_type)
bookmarks (user_id, news_item_id)
evidence_items (news_item_id, title, url, snippet)
```

## Build and Test

```bash
# Development
npm install
npm run dev        # Start dev server on localhost:5173

# Production
npm run build      # Build for production
npm run preview    # Preview production build

# Code Quality  
npm run lint       # ESLint check
```

## Environment Setup
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Conventions

### File Naming
- Components: `PascalCase.jsx` (NewsCard.jsx, FilterTabs.jsx)
- Hooks: `camelCase.js` (useAuth.js, useNews.js)  
- Constants: `SCREAMING_SNAKE_CASE`

### Event Handlers
```javascript
// Use on{Action} pattern
const onCategoryChange = (slug) => { /* ... */ };
const onFilterSelect = (filter) => { /* ... */ };
```

### API Typing
```javascript
// Map database fields to UI-friendly names
function mapNewsItem(item) {
  const verdict = item.verdicts?.[0] ?? null;
  return {
    ...item,
    verification_status: verdict?.verdict || "UNVERIFIED",
    credibility_score: verdict?.confidence ?? 0,
  };
}

## Key Files Reference

- [PRD.md](PRD.md): Complete product requirements and technical decisions
- [src/App.jsx](src/App.jsx): Route setup and auth listener
- [src/lib/supabaseClient.js](src/lib/supabaseClient.js): Database client configuration
- [src/api/newsApi.js](src/api/newsApi.js): Core data fetching patterns
- [src/hooks/useAuth.js](src/hooks/useAuth.js): Authentication patterns
- [src/pages/Feed.jsx](src/pages/Feed.jsx): Main application screen