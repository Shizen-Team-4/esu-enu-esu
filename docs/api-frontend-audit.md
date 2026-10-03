# API ⇄ Frontend Hookup Audit

**Date:** 2026-10-03  
**Branch:** fix/search-escape-and-video-duration  
**Measured against:** `docs/api-contract.md` and `CLAUDE.md`

This audit reviews how the backend (use cases in `src/lib/server/**`, wired in `container.ts`) hooks up to the frontend (`src/routes/**`, `src/lib/components/**`). Issues below are drafts to be posted manually.

## Status (2026-10-03)

The backend-first plan has landed. Per tracking item:

- [x] 1. `listUserPosts` use case, type filter, `NOT_FOUND`, cursor param on profile routes (UI pagination still open)
- [x] 2. Contract updated to keep 24h expiry + story likes; tray item renamed to `user` with `storyCount`
- [x] 3. Upload contract documented; `/api/feed` rejects `scope=saved`
- [ ] 5. Backend half done: like/unlike/save/unsave contract shapes, `listSavedPosts` use case. UI, Bookmarks page and share still open
- [x] 9. Error envelope end-to-end, `error.<CODE>` i18n, field errors, upload/auth error mapping, story `seen` action
- [x] 10. Guards in hooks, shared helpers, contract types out of `$lib/server`, no cross-feature imports, debug route via container, media URL once, preferences once, dashboard split into `/dashboard` and `/create` (`/` vs `/dashboard` feed unification deferred to issue 4)
- [x] 11. Unit tests for users/stories/media, coverage include widened, auth-guard e2e (full happy-path e2e still open)

Still open for the frontend plan: 4, 5 (UI), 6, 7, 8, 12. New findings:

- `local-upload` validates every upload as `purpose: 'post'` (dev-only path)
- `markStorySeen` on own story records a view (docs changed to match code)
- Story create's invalid-media / rate-limit errors are only enforced in SQL
- Full login -> post -> like -> follow -> story e2e is missing
- Notifications nav slot decided as a placeholder page

## Findings

### A. Contract operations with no route/UI hookup

| Contract op                                                                | Backend state                                                                                                                                                                          | Frontend state                                                                                     |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `listFeed scope:"following"`                                               | supported in `list-posts.ts`                                                                                                                                                           | never requested; `/` and `/dashboard` load `scope:"all"` only                                      |
| Feed pagination                                                            | `/api/feed` exists                                                                                                                                                                     | unused — no "load more"/infinite scroll on `/` or `/dashboard`                                     |
| `listReels`                                                                | faked via `listFeed({type:'reel'})`                                                                                                                                                    | `/reels` uses PostCard, not reel layout                                                            |
| `listUserPosts`                                                            | missing; routes call `listFeed({authorId})` → no `NOT_FOUND`, and Posts tab passes no `type` so **reels show under Posts** (`u/[username]/+page.server.ts`, `profile/+page.server.ts`) | no pagination on grid                                                                              |
| `updatePost`, `deletePost`                                                 | wired in container                                                                                                                                                                     | no action / no UI                                                                                  |
| `likePost`/`unlikePost`                                                    | `reactToPost` returns full `Post`, not `{liked, likes}`                                                                                                                                | like only on `/dashboard`; full redirect, no optimistic update; `/`, `/p/[id]`, `/reels` read-only |
| `savePost`/`unsavePost`/`listSavedPosts`                                   | `reactToPost('save')` exists, `scope:'saved'` leaks into public `/api/feed`                                                                                                            | no route, no UI, no Bookmarks page                                                                 |
| Comments (`listComments`, `listReplies`, `createComment`, `deleteComment`) | table exists, **no domain/app/infra**                                                                                                                                                  | no UI                                                                                              |
| `updateMe`, OAuth username onboarding (`username: ""`)                     | missing                                                                                                                                                                                | missing                                                                                            |
| `listFollowers` / `listFollowing`                                          | missing                                                                                                                                                                                | counts not clickable                                                                               |
| `getMe` in nav/header                                                      | —                                                                                                                                                                                      | header has no avatar/logout; `/` shows "Log in" even when logged in                                |
| Share                                                                      | —                                                                                                                                                                                      | `<a href={shareUrl}>` instead of Web Share API / clipboard                                         |

### B. Contract drift (code ≠ `api-contract.md`)

- Stories: code has 24h expiry (`STORY_LIFETIME_MS`, `expiresAt`, `access()` filter in `drizzle-stories.ts`), `likes`/`viewer.liked` and a `likeStory` op; contract says **no expiration** and no story likes. UI text `story.expires` / `story.expired` reflects the drift.
- `StoryTrayItem` shape: code `{author, storyCount}` vs contract `{user, stories[]}`.
- `createUpload` result adds `thumbnailUploadUrl`, input `thumbnailSizeBytes`, header `If-None-Match` — not in contract.
- `/api/feed` accepts `scope=saved` (contract: `following|all`).
- Action failures return `fail(4xx, { code })` — no `error` envelope, no `fields`; status codes inconsistent (400 vs 422) and differ from `error-response.ts`.

### C. Error handling / UX on the frontend

- No `error.<CODE>` i18n keys; screens show generic `auth.error`/`preferences.error`; field errors never shown under fields.
- `upload-file.ts` throws plain `Error` and discards the envelope (`PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, R2 `403` expired) → Composer always shows one generic message.
- `submit-auth.ts` collapses BetterAuth errors to `FAILED`/`EMAIL_NOT_VERIFIED` (no `CONFLICT`/`TAKEN`, `INVALID_CREDENTIALS`, `RATE_LIMITED`).
- No "failed vs empty" distinction (§2.4): `/` and `/dashboard` have no empty state or retry; load failures 500 silently.
- Story `seen` uses hand-rolled `fetch('?/seen')` with SvelteKit internal header and ignored result.

### D. CLAUDE.md architecture violations

- §1/§3 Auth guard: contract §2.2 says protected pages are guarded in `hooks.server.ts`; every load/action repeats `if (!locals.user) redirect` + `if (!locals.services) error(503)` + identical `try/catch AppError → fail` (duplicated blocks in `dashboard`, `stories`, `u/[username]`, `settings`).
- §1 Routes: `api/debug/+server.ts` imports `drizzle-orm` + `getDb` (forbidden in routes).
- §3 Svelte components import types from `$lib/server/**` (`PostCard`, `PostGrid`, `ProfileHeader`, `StoryTray`) — shared types should live in `shared/` / `packages/types`, not server paths.
- §3 `stories`/`users` domain import `posts/domain/post` (`Media`, `UserSummary` duplicated in `posts` and `users`) — cross-feature reach-in.
- §3 `container.ts` repeats `MEDIA_PUBLIC_URL` normalization 3×; preferences fetched 3× per request (hooks, `+layout.server.ts`, `dashboard`).
- §2 `/dashboard` mixes composer, story tray, feed and a duplicate preferences form (also on `/settings`).
- §1 `get-preferences.ts` (application) imports `$lib/i18n/config` — OK as pure type, but verify; `create-post.ts` hard-codes rate limit 30/h and 3600000 instead of shared config.

### E. CLAUDE.md §4 testing gaps

- No tests for `users/application/*` (getMe, getProfile, searchUsers, followUser), `stories/domain` + `stories/application/*`, `media/infrastructure/*`.
- `vitest.config.ts` coverage `include` whitelist omits users/stories/media-app, so the 80/90% gates can't fail for them.
- No Playwright e2e covering login → post → like → follow → story.

### F. CLAUDE.md §5 frontend rules

- Nav order/destinations wrong: is Home, Reels, Create, Search, Profile; must be Home, Search, Create, Notifications, Bookmarks (note: contract says notifications are out of scope — needs team decision).
- No shared hatch band component; posts rendered as `.panel` cards.
- Media: `PostGrid` and avatars use `object-cover`; story media uses `rounded-card`; gallery is scroll-snap with no prev/next arrows or `2 / 5` counter.
- Hard-coded `#ffffff` in `login/+page.svelte`; hard-coded `SNS`, `English/日本語/ខ្មែរ` strings; `style="max-width: …px"` one-offs.
- i18n corruption: `preferences.km` = `"?????"`, `preferences.ja` = `"???"` in all 3 locale files.
- Video viewer (dark, portrait vs landscape controls, comment bottom sheet) and comment thread UI not implemented.

## Issue drafts

### 0. [Tracking] API ⇄ frontend hookup audit

- [x] 1. (backend done) bug: Profile "Posts" tab shows reels; add `listUserPosts` use case
- [x] 2. Contract drift: stories expiry & story likes
- [x] 3. Align upload contract
- [ ] 4. Feed hookup: following/all scope, pagination, empty/error states
- [ ] 5. (backend done) Like/save/share actions everywhere + optimistic update
- [ ] 6. Post edit & delete hookup
- [ ] 7. Comments feature end-to-end
- [ ] 8. Users: `updateMe`, OAuth username onboarding, followers/following lists
- [x] 9. Error envelope end-to-end
- [ ] 10. (done, except feed unification in 4) Architecture cleanup per CLAUDE.md §1–3
- [ ] 11. (done, full e2e open) Test coverage gaps
- [ ] 12. Frontend design-rule compliance (§5)

### 1. bug: Profile "Posts" tab shows reels; add `listUserPosts` use case

**Labels:** backend, bug

**Problem:**

- `listUserPosts` use case is missing; routes call `listFeed({authorId})` instead (`u/[username]/+page.server.ts`, `profile/+page.server.ts`)
- Posts tab passes no `type` filter, so reels incorrectly appear under Posts on a user profile
- No `NOT_FOUND` error when username doesn't exist
- Grid has no pagination despite contract supporting it

**References:** `docs/api-contract.md` §3.2 (listUserPosts), `CLAUDE.md` §1 (layer separation, routes call use cases)

**Acceptance criteria:**

- [ ] `listUserPosts` use case exists in `src/lib/server/posts/application/` with domain/application/infrastructure layers
- [ ] Returns `NOT_FOUND` AppError when username doesn't exist
- [ ] Filters out reels (non-reel Posts only) or accepts optional `type` parameter per contract
- [ ] Supports cursor-based pagination per contract shape `{posts, nextCursor}`
- [ ] Routes (`u/[username]/+page.server.ts`, `profile/+page.server.ts`) call the new use case
- [ ] Grid UI on profile tab uses pagination or infinite scroll to load more

**Tests required:**

- Unit tests (in-memory PostRepository fake): success (posts with cursor), NOT_FOUND, empty user, type filtering
- Tests must reach ≥90% coverage for domain/application layers (CLAUDE.md §4)

### 2. Contract drift: stories expiry & story likes

**Labels:** contract, backend, frontend

**Problem:**

- Code implements 24h story expiry (`STORY_LIFETIME_MS`, `expiresAt`, `access()` filter in `drizzle-stories.ts`), but contract specifies **no expiration**
- Code has `likes`/`viewer.liked` and `likeStory` operation; contract says **no story likes**
- UI text (`story.expires` / `story.expired`) reflects the expired code, not the contract
- `StoryTrayItem` shape mismatch: code `{author, storyCount}` vs contract `{user, stories[]}`

**References:** `docs/api-contract.md` §3.4 (Story shape), `CLAUDE.md` §1 (domain rules)

**Acceptance criteria:**

- [ ] Team decides: update `api-contract.md` to match 24h expiry + story likes, OR remove `expiresAt` / likes from code
- [ ] `StoryTrayItem` shape aligns with contract
- [ ] UI text keys (`story.expires` / `story.expired`) removed or updated to match decision
- [ ] No orphaned domain rules after decision is implemented

**Tests required:**

- Unit tests: story visibility rules (unexpired stories visible, expired filtered) if expiry is kept
- Tests must reach ≥90% domain/application coverage (CLAUDE.md §4)

### 3. Align upload contract

**Labels:** contract

**Problem:**

- `createUpload` result adds `thumbnailUploadUrl` and input includes `thumbnailSizeBytes` — not documented in contract
- Request header `If-None-Match` used but not in contract
- `/api/feed` accepts `scope=saved` but contract specifies only `following` or `all`

**References:** `docs/api-contract.md` §3.1 (createUpload shape), §3.3 (listFeed params)

**Acceptance criteria:**

- [ ] Document `thumbnailUploadUrl` and `thumbnailSizeBytes` in contract, OR remove them from code
- [ ] Document `If-None-Match` or remove ETag logic
- [ ] `/api/feed` rejects `scope=saved` (or contract adds it if intentional)

**Tests required:**

- Route tests verifying input validation and rejection of invalid scopes
- ≥80% coverage of changed route code (CLAUDE.md §4)

### 4. Feed hookup: following/all scope, pagination, empty/error states

**Labels:** frontend

**Problem:**

- `/` and `/dashboard` load `scope:"all"` only; "following" scope supported in `list-posts.ts` is never requested
- `/api/feed` supports cursor pagination but no "load more"/infinite scroll UI exists on either page
- No empty state or error recovery: load failures 500 silently, no retry button
- No "failed vs empty" distinction (§2.4 contract)
- Logged-in header shows "Log in" even after login; `getMe` endpoint not called in nav

**References:** `docs/api-contract.md` §2.4 (response envelopes), §3.3 (listFeed), `CLAUDE.md` §1 (routes call use cases), §5 (empty/error states)

**Acceptance criteria:**

- [ ] Home page tab or toggle switches between `scope:"all"` and `scope:"following"`
- [ ] Cursor pagination implemented (infinite scroll or "load more" button)
- [ ] Empty state message + empty state UI on zero posts
- [ ] Error state with retry button on fetch failure
- [ ] `/` and `/dashboard` share one feed load logic (remove duplication)
- [ ] Header calls `getMe` and renders avatar + logout when logged in

**Tests required:**

- Playwright e2e: load feed, paginate, retry on error
- Unit tests: feed state logic (scope switching, cursor management)
- ≥80% coverage of changed code (CLAUDE.md §4)

### 5. Like/save/share actions everywhere + optimistic update

**Labels:** backend, frontend

**Problem:**

- Like only available on `/dashboard`; full redirect, no optimistic update; `/`, `/p/[id]`, `/reels` are read-only
- Save (`savePost`/`unsavePost`) has no UI and no Bookmarks page; `scope:'saved'` leaks into public `/api/feed`
- `reactToPost` returns full `Post`, not contract shape `{liked, likes}` or `{saved}`
- Share uses `<a href={shareUrl}>` instead of Web Share API / clipboard
- Saving not available in production (no Bookmarks route, no nav tab)

**References:** `docs/api-contract.md` §3.2 (likePost/unlikePost/savePost/unsavePost contract shapes), §3.3 (listSavedPosts), `CLAUDE.md` §1 (use case return shapes), §5 (UI components)

**Acceptance criteria:**

- [ ] `likePost`/`unlikePost` return `{liked: boolean, likes: number}` per contract
- [ ] `savePost`/`unsavePost` return `{saved: boolean}` per contract
- [ ] Like button on all posts (grid, feed, detail) with optimistic UI update via `use:enhance`
- [ ] Save button on all posts with optimistic update
- [ ] Bookmarks page at `/bookmarks` using `listSavedPosts`
- [ ] Bookmarks nav tab (one of five nav destinations per §5)
- [ ] Share via Web Share API or clipboard (not just link)
- [ ] `/api/feed` rejects `scope=saved`

**Tests required:**

- Unit tests: like/save actions (success, already liked/saved, undo)
- Playwright e2e: like → optimistic update, save → Bookmarks page, share trigger
- Route tests: verify contract shapes returned
- ≥80% coverage of changed code, ≥90% domain/application (CLAUDE.md §4)

### 6. Post edit & delete hookup

**Labels:** frontend

**Problem:**

- `updatePost` and `deletePost` are wired in container but have no route action or UI
- No UI to trigger edit or delete; no author-only visibility check on frontend
- Posts appear read-only to their own author

**References:** `docs/api-contract.md` §3.2 (updatePost, deletePost), `CLAUDE.md` §1 (routes call use cases), §5 (author-only UI)

**Acceptance criteria:**

- [ ] Edit/delete menu on own posts (three-dot menu or similar)
- [ ] Route action calls `updatePost` or `deletePost` use case
- [ ] Only post author can see/use edit/delete buttons
- [ ] Edit opens modal or inline form with caption
- [ ] Delete shows confirmation and removes post from UI after success

**Tests required:**

- Unit tests: edit/delete use case edge cases (not owner, invalid input)
- Playwright e2e: edit own post caption, delete own post
- ≥80% coverage of changed code, ≥90% domain/application (CLAUDE.md §4)

### 7. Comments feature end-to-end

**Labels:** backend, frontend

**Problem:**

- Comments table exists but **no domain/app/infra layers** implemented
- No UI or routes for list/create/delete comments
- No thread flattening logic, no focused-branch UI for deep threads
- No sticky composer per §5 Comments spec

**References:** `docs/api-contract.md` §3.5 (comments operations), `CLAUDE.md` §1 (layers), §5 (Comments: two-level UI, focused branch, sticky composer)

**Acceptance criteria:**

- [ ] Domain layer: Comment entity, thread-flattening rule (compute flat list from nested, mark ancestors in focused branch)
- [ ] Application layer: `listComments`, `listReplies`, `createComment`, `deleteComment` use cases
- [ ] Infrastructure: Drizzle repository mapping rows to Comment domain type
- [ ] Routes: GET/POST `/api/posts/[id]/comments`, POST `/api/comments/[id]`, DELETE `/api/comments/[id]`
- [ ] UI: two visual levels (parent and direct reply only), collapse/expand replies, focused branch with ancestor context
- [ ] Sticky reply composer above bottom nav while scrolling
- [ ] Delete shows confirmation and refreshes thread
- [ ] Author-only delete button

**Tests required:**

- Unit tests: thread flattening (flat list, focused branch with ancestors), comment validation
- Unit tests: all 4 use cases (success, not found, not owner, empty thread)
- Playwright e2e: load comments → reply → see nested → focus branch → delete
- ≥80% changed, ≥90% domain/application (CLAUDE.md §4)

### 8. Users: `updateMe`, OAuth username onboarding, followers/following lists

**Labels:** backend, frontend

**Problem:**

- `updateMe` missing (can't change profile, avatar, bio, etc.)
- OAuth username onboarding (`username: ""`) missing (new user stuck at login)
- `listFollowers` / `listFollowing` missing; follow counts not clickable
- Header has no avatar; user can't log out
- Profile edit page assumes routes exist but they don't

**References:** `docs/api-contract.md` §2.1 (getMe), §3.6 (updateMe, listFollowers, listFollowing), `CLAUDE.md` §1 (layers), §2 (one use case per file)

**Acceptance criteria:**

- [ ] `updateMe` use case (domain: validation; app: availability check; infra: Drizzle save)
- [ ] OAuth flow redirects new user to `/onboard` to set username before completing login
- [ ] `/onboard` validates username and calls `updateMe`
- [ ] `listFollowers` / `listFollowing` use cases with pagination
- [ ] Routes `/api/users/me` (PATCH), `/api/users/[id]/followers`, `/api/users/[id]/following`
- [ ] Followers/following counts clickable on profile (show modal or page)
- [ ] Settings page lets user edit profile, avatar, bio
- [ ] Header shows avatar + username + logout button

**Tests required:**

- Unit tests: username validation (length, characters), updateMe success/conflict
- Unit tests: follower list pagination, empty users
- Playwright e2e: OAuth → onboard → set username → profile page → edit → logout
- ≥80% changed, ≥90% domain/application (CLAUDE.md §4)

### 9. Error envelope end-to-end

**Labels:** frontend, i18n, bug

**Problem:**

- No `error.<CODE>` i18n keys; screens show generic `auth.error`/`preferences.error`
- Field errors never displayed under fields
- `upload-file.ts` throws plain `Error` and discards envelope (`PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, R2 `403` expired) → one generic message always shown
- `submit-auth.ts` collapses BetterAuth errors to `FAILED`/`EMAIL_NOT_VERIFIED` (loses `CONFLICT`, `TAKEN`, `INVALID_CREDENTIALS`, `RATE_LIMITED`)
- Story `seen` uses hand-rolled `fetch('?/seen')` with SvelteKit internal header and ignores result
- Action failures return `fail(4xx, { code })` — no `error` envelope, no `fields` per contract

**References:** `docs/api-contract.md` §2.4 (error envelope: `{ code, error, fields }`), `CLAUDE.md` §1 (routes return contract envelope), §5 (i18n for all user text)

**Acceptance criteria:**

- [ ] All error codes (`VALIDATION_FAILED`, `PAYLOAD_TOO_LARGE`, `CONFLICT`, `RATE_LIMITED`, etc.) have `error.<CODE>` keys in all locales (`en`, `ja`, `km`)
- [ ] Route actions return error envelope per contract: `fail(status, { code, error, fields })`
- [ ] Form fields show validation error messages below input when `fields[fieldName]` present
- [ ] `upload-file.ts` catches and surfaces error codes (not plain `Error`)
- [ ] `submit-auth.ts` preserves BetterAuth error codes in action response
- [ ] Story `seen` replaced with route action (no `fetch('?/seen')`)
- [ ] `pnpm check:i18n` passes (no missing keys)

**Tests required:**

- Unit tests: error code → i18n key mapping; `upload-file.ts` error handling
- Playwright e2e: upload oversized file → error shown; auth conflict → error shown; field validation error displayed
- ≥80% changed code (CLAUDE.md §4)

### 10. Architecture cleanup per CLAUDE.md §1–3

**Labels:** architecture

**Problem:**

- Auth guard repeated 4× per feature: every load/action in `dashboard`, `stories`, `u/[username]`, `settings` duplicates `if (!locals.user) redirect` + `if (!locals.services) error(503)` + `try/catch AppError → fail`
- `api/debug/+server.ts` imports `drizzle-orm` + `getDb` (forbidden in routes per §1)
- Svelte components import types from `$lib/server/**` (`PostCard`, `PostGrid`, `ProfileHeader`, `StoryTray`) — §3 requires shared types in `shared/` or `packages/types`
- `stories`/`users` domain import `posts/domain/post` (`Media`, `UserSummary` duplicated) — cross-feature imports violate §3
- `container.ts` repeats `MEDIA_PUBLIC_URL` normalization 3×; preferences fetched 3× per request (hooks, `+layout.server.ts`, `dashboard`)
- `/dashboard` mixes composer, story tray, feed, and duplicate preferences form (also on `/settings`) — split per §2

**References:** `docs/api-contract.md` §2.2 (auth guard in hooks), `CLAUDE.md` §1 (layers, dependencies inward), §2 (single responsibility), §3 (decoupling)

**Acceptance criteria:**

- [ ] Centralized `requireAuth()` and `requireServices()` functions in `hooks.server.ts`; all protected routes use them
- [ ] `api/debug/+server.ts` uses container (or removed if not needed)
- [ ] Client-visible types (`Post`, `User`, `Story`, `Media`, etc.) live in `shared/` or `packages/types`, not `$lib/server/**`
- [ ] `stories` and `users` domains depend on `shared/` types only, not on `posts/domain`
- [ ] `container.ts` builds `MEDIA_PUBLIC_URL` once, stored on `locals.services` or similar
- [ ] Preferences fetched once per request (in hooks or layout, not repeated)
- [ ] `/dashboard` split: composer → `/compose`, story tray + feed → home, preferences form removed → `/settings`

**Tests required:**

- Playwright e2e: protected routes redirect on logout
- Unit tests: service availability check (no database, return 503)
- No unit test changes needed (architecture refactor)

### 11. Test coverage gaps

**Labels:** tests

**Problem:**

- No unit tests for `users/application/*` (getMe, getProfile, searchUsers, followUser)
- No tests for `stories/domain` + `stories/application/*`
- No tests for `media/infrastructure/*`
- `vitest.config.ts` coverage `include` whitelist omits users/stories/media-app, so 80/90% gates can't fail for them
- No Playwright e2e covering login → post → like → follow → story (happy path)

**References:** `CLAUDE.md` §4 (unit testing requirements), §7 (coverage gate: ≥80% changed, ≥90% domain/application)

**Acceptance criteria:**

- [ ] Unit tests for `users/application/*` with in-memory `UserRepository` fake: getMe (found, not found), getProfile (found, not found), searchUsers (empty, paginated), followUser (success, already following, not found)
- [ ] Unit tests for `stories/domain` (expiry rule, visibility) and `stories/application/*` (listStories, createStory, deleteStory, etc.)
- [ ] Unit tests for `media/infrastructure/*` mappers (if logic present)
- [ ] `vitest.config.ts` coverage `include` expanded to include users/stories/media-app paths
- [ ] Playwright e2e: login → create post → like → follow user → view story → comment (end-to-end happy path)
- [ ] Coverage report shows ≥80% for new/changed code, ≥90% for domain/application layers

**Tests required:**

- Write in-memory fakes for new repositories
- Playwright e2e (1 test) covering all main flows
- ≥80% coverage of test code itself (if new helpers written)

### 12. Frontend design-rule compliance (§5)

**Labels:** frontend, i18n

**Problem:**

- Nav order/destinations wrong: currently Home, Reels, Create, Search, Profile; must be Home, Search, Create, Notifications, Bookmarks per CLAUDE.md §5
  - **Team decision needed:** contract says notifications are out of scope, but CLAUDE.md requires a Notifications tab. This blocks nav change until one doc is updated.
- No shared hatch band component; posts rendered as `.panel` cards
- Media: `PostGrid` and avatars use `object-cover` (stretches/crops); story media uses `rounded-card`; gallery scroll-snap with no prev/next arrows or `2 / 5` counter
- Hard-coded colors: `#ffffff` in `login/+page.svelte`; hard-coded strings `SNS`, `English/日本語/ខ្មែរ` not in i18n
- One-off `style="max-width: …px"` overrides instead of tokens
- i18n corruption: `preferences.km` = `"?????"`, `preferences.ja` = `"???"` in all 3 locale files
- Video viewer not implemented (dark mode, portrait vs landscape controls, comment bottom sheet)
- Comment thread UI not implemented (two-level visual hierarchy, focused branch, ancestor context lines)

**References:** `CLAUDE.md` §5 (visual style, layout, post separation, media, navigation, comments, video, frontend guard rails), `docs/api-contract.md` (notifications out of scope — intro paragraph)

**Acceptance criteria:**

- [ ] **BLOCKING:** Team decision: update `api-contract.md` to include notifications scope, OR update CLAUDE.md §5 Nav to remove Notifications requirement
- [ ] Nav destinations fixed to: Home, Search, Create, Notifications (per decision above), Bookmarks — in that order
- [ ] Shared hatch band component built in `src/lib/components/` and used to separate posts/sections
- [ ] Media: `object-fit: contain` (not `cover`); aspect ratio maintained; carousel with prev/next arrows + `2 / 5` counter
- [ ] All colors defined in Tailwind theme `tailwind.config.js` or CSS variables; no `#ffffff` or hex in component code
- [ ] Strings (`SNS`, `English`, etc.) in i18n locale files (en, ja, km)
- [ ] All spacing/sizes via Tailwind classes or tokens, no one-off `style=` overrides
- [ ] `preferences` keys fixed (not `"?????"`) and all locales complete
- [ ] Video viewer: dark layout, portrait → controls beside video, square/landscape → controls below, comment sheet overlay
- [ ] Comment thread UI: two levels (parent + reply), collapse/expand buttons, focused branch with ancestor dashed lines, sticky composer

**Tests required:**

- Playwright e2e: nav destinations clickable and correct order
- Playwright e2e: media carousel arrows + counter working
- Playwright e2e: video viewer controls positioned correctly per orientation
- Visual regression tests (or manual screenshot check at 390px and wide screen per §5)
- ≥80% coverage of changed UI logic (CLAUDE.md §4)
