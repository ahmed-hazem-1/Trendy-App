# Fix: Unverified Filter Shows No Posts

## Root Cause Analysis

The UNVERIFIED filter in `src/api/newsApi.js` is broken due to a **flawed filtering strategy**. Here's the chain:

### Current (broken) logic — `newsApi.js:295-297`

```js
if (unverifiedClientFilter) {
  const filtered = merged.filter((item) => !item.verdicts);
  return { data: filtered, count: count ?? filtered.length, page, pageSize };
}
```

The filter keeps only items where `item.verdicts` is **falsy** (i.e., no verdict record exists in the `verdicts` table). But according to the PRD (§9.4) and the `mapNewsItem` function used everywhere in the UI:

```js
verification_status: verdict?.verdict || item.verification_status || "UNVERIFIED"
```

An item is "UNVERIFIED" in the UI if **either**:
1. It has no verdict row at all (`item.verdicts` is null), **OR**
2. It has a verdict row where `verdict.verdict === "UNVERIFIED"` or `verdict.verdict === "INCONCLUSIVE"`

The current code **only catches case 1** and **misses case 2 entirely**. Items that have been explicitly verdicted as "UNVERIFIED" or "INCONCLUSIVE" by the AI pipeline have a `verdicts` row, so `!item.verdicts` is `false`, and they get filtered out.

The same bug exists in the `searchNews` function at line 824-826.

### Why "All Posts" shows them

In the ALL filter, no `unverifiedClientFilter` is applied — `attachVerdicts` runs, and `mapNewsItem` correctly derives the status from `verdict?.verdict`. Items with `verdict.verdict === "UNVERIFIED"` display the "غير متحقق" badge correctly. But the UNVERIFIED tab can't find them.

## Fix

**File: `src/api/newsApi.js`** — two locations, same fix pattern.

### Change 1: `fetchNewsItems` (line ~295-297)

Replace:
```js
if (unverifiedClientFilter) {
  const filtered = merged.filter((item) => !item.verdicts);
  return { data: filtered, count: count ?? filtered.length, page, pageSize };
}
```

With:
```js
if (unverifiedClientFilter) {
  const filtered = merged.filter((item) => {
    if (!item.verdicts) return true;
    const v = item.verdicts.verdict?.toUpperCase();
    return v === "UNVERIFIED" || v === "INCONCLUSIVE";
  });
  return { data: filtered, count: count ?? filtered.length, page, pageSize };
}
```

### Change 2: `searchNews` (line ~824-826)

Replace:
```js
if (unverifiedClientFilter) {
  const filtered = merged.filter((item) => !item.verdicts);
  return { data: filtered.slice(0, limit), count: filtered.length };
}
```

With:
```js
if (unverifiedClientFilter) {
  const filtered = merged.filter((item) => {
    if (!item.verdicts) return true;
    const v = item.verdicts.verdict?.toUpperCase();
    return v === "UNVERIFIED" || v === "INCONCLUSIVE";
  });
  return { data: filtered.slice(0, limit), count: filtered.length };
}
```

### What this preserves

- **VERIFIED filter**: unchanged — uses `prefetchVerdicts` → `VERDICT_ALIASES.VERIFIED` → `mode: "include"` with matching IDs
- **FAKE filter**: unchanged — uses `prefetchVerdicts` → `VERDICT_ALIASES.FAKE` → `mode: "include"` with matching IDs
- **ALL filter**: unchanged — no `prefetchVerdicts` call, just `attachVerdicts`
- **Category filtering**: unchanged — operates independently before verdict filtering
- **Search**: only the `unverifiedClientFilter` client-side filter is modified; all other search logic is untouched
- **Pagination / overfetch**: unchanged — the `overfetchPageSize = pageSize * 3` heuristic still applies

### Why INCONCLUSIVE is included

The `StatusBadge` component and `VERDICT_ICON` map in `Posts.jsx:154` map `INCONCLUSIVE` to the same UI as `UNVERIFIED`. Including it ensures the filter captures all items the UI would display as "غير متحقق".
