# Backend Requirements and Implementation Guide

Issues: #37, #38 and every backend issue (#10–#32). Status: **draft for team review**.

[`api-contract.md`](./api-contract.md) says **what** the frontend sends and receives. This document says **everything the backend must build to satisfy it, and how**: architecture, infrastructure, every operation, shared logic, background jobs and tests. The tables are in [`db-schema.md`](./db-schema.md). The coding rules are in [`CLAUDE.md`](../CLAUDE.md).

When this document and the contract disagree, **the contract wins**. Fix this document in the same PR.

## Contents

1. [Scope](#1-scope)
2. [Contract review](#2-contract-review)
3. [Architecture](#3-architecture)
4. [Infrastructure](#4-infrastructure)
5. [Work list](#5-work-list)
6. [Shared logic](#6-shared-logic)
7. [Feature logic](#7-feature-logic)
8. [Deferred features](#8-deferred-features)
9. [Testing](#9-testing)
10. [Decisions needed from the team](#10-decisions-needed-from-the-team)

---

## 1. Scope

| Status                         | Features                                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **In scope** (in the contract) | Auth, me/profile, follow, user search, media upload, posts and reels, feed, like, save, share URL, comments, stories, preferences, language   |
| **In scope** (not in contract) | Reports and moderation (#19). The contract already has its rate limit and `note` rule; the operations are proposed in [7.10](#710-reports-19) |
| **Deferred**                   | Notifications (#28–#32), accessibility preferences (#24). Design kept in [8](#8-deferred-features) so the work can start when the team agrees |
| **Out of scope**               | Post visibility settings, push notifications, "recommended" feed order, private accounts                                                      |

The contract decided to drop notifications, but issues #28–#32 are still open with owners. The team must close them or bring notifications back into the contract (see [10](#10-decisions-needed-from-the-team)).

---

## 2. Contract review

### 2.1 Resolved since the last review

| Item                                                  | Resolution in the current contract                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| Contents linked to sections that did not exist        | Contents now lists 1–4 only                                         |
| `listUserStories` had no 🔒                           | Now 🔒                                                              |
| Push notification setting had no subscription flow    | Notifications removed from `Preferences`                            |
| Visibility rules (`public` / `followers` / `private`) | Removed. All posts and reels are public                             |
| Story expiry after 24 h                               | Back in the contract: `expiresAt`, 24 h lifetime, `likeStory`       |
| REST URLs were the contract                           | Contract now defines **operations**; URLs are implementation detail |

### 2.2 Still open — must fix before the backend starts

| #   | Problem                                                                                                                                                     | Suggested fix                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | **No issue owns** me/profile, follow, user search, like, save, comments or stories. Phases 1–5 only cover auth, posts, feed, upload, report and preferences | Create issues for the **NEW** rows in [5](#5-work-list)                                                                                        |
| B   | **Report operations are missing** from the contract, although its rate limit (2.7) and `note` rule (2.6) exist                                              | Add the operations in [7.10](#710-reports-19) as contract section 4.9                                                                          |
| C   | **Video thumbnails have no source.** `Media.thumbnailUrl` is a video poster, but Workers cannot run ffmpeg, and the upload flow has no poster step          | The browser captures a frame with `<canvas>` and uploads it. `createUpload` for a video also returns `thumbnailUploadUrl` (image/webp, ≤ 1 MB) |
| D   | **R2 is not set up.** No R2 binding in `wrangler.jsonc`, no R2 keys in `.env.example`, no bucket CORS                                                       | See [4](#4-infrastructure)                                                                                                                     |
| E   | **No email sender.** Verification and password reset (#13) need an email provider                                                                           | Choose one (Resend, MailChannels, …) and add its key to `.env.example`                                                                         |

### 2.3 Should clarify

| #   | Problem                                                                                                                                   | Suggested fix                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| F   | When is `EMAIL_NOT_VERIFIED` returned? Only on sign-in, or also on posting / commenting?                                                  | Sign-in only (BetterAuth `requireEmailVerification: true`). Google users are verified already                      |
| G   | OAuth users have `username: ""`. A unique column cannot hold `""` for many users                                                          | Store `NULL`, return `""`. Pages that need a username redirect to "pick a username"                                |
| H   | A bad `limit` (`0`, `51`, `"abc"`) is not defined. Only a bad `cursor` is                                                                 | `VALIDATION_FAILED`, `fields.limit = "INVALID_FORMAT"`                                                             |
| I   | Can a username be changed? Old profile links break                                                                                        | Allow it, at most once per 30 days **(proposed)**                                                                  |
| J   | What happens to saves and comments when a post is deleted?                                                                                | Lists hide them (joins check `posts.deleted_at IS NULL`). The cleanup job deletes them with the post after 30 days |
| K   | Rate limit counters: KV is eventually consistent and allows 1 write/s per key, so it is bad for counters                                  | Count rows already in D1 ([6.6](#66-rate-limits))                                                                  |
| L   | Search with `_` or `%` in `q` acts as SQL wildcards                                                                                       | Escape them (`LIKE ? ESCAPE '\'`)                                                                                  |
| M   | ~~Stories never expire, so the tray grows~~ **Resolved:** stories expire after 24 h (`expires_at`), so the tray only shows active stories | None                                                                                                               |
| N   | Who can delete a comment? Contract 3.4 says "comment author or post author (proposed)"                                                    | Keep the proposal; it is implemented in [7.8](#78-comments-new)                                                    |

### 2.4 Code notes

- `src/hooks.server.ts` copies the language list (`SUPPORTED_LOCALES`) instead of importing `SUPPORTED_LANGS` from `src/lib/i18n/config.ts`, and `console.log`s headers on every request. Fix both in #10 or #26.
- `App.Locals` only has `lang`. It needs `user`, `session` and `services` ([3.4](#34-composition-root)).
- `.env.example` is missing `BETTER_AUTH_URL`, R2 keys and the email key.
- `src/lib/server/db/schema.ts` is empty. The first migration comes from [`db-schema.md`](./db-schema.md).

---

## 3. Architecture

The backend follows the Clean Architecture rules in [`CLAUDE.md`](../CLAUDE.md). This section shows how they apply to this app.

### 3.1 Layers

```text
routes        +page.server.ts (load / actions), +server.ts, hooks.server.ts    ← adapters for SvelteKit
infrastructure Drizzle repositories, R2 storage, KV cache, email, BetterAuth    ← adapters for services
application   one use case per contract operation + port interfaces            ← orchestration
domain        entities, value objects, validation, rules (pure TypeScript)      ← business logic
```

Dependencies point **down only**. Domain and application never import Drizzle, SvelteKit, BetterAuth or Cloudflare types.

### 3.2 Folder layout

```text
src/lib/server/
  shared/
    domain/          AppError, error codes, Result, Page<T>, Cursor, Viewer, text rules
    application/     ports: Clock, IdGenerator, RateLimiter, TaskRunner (waitUntil)
    infrastructure/  SystemClock, PrefixedIdGenerator, D1RateLimiter, mappers for time/URLs
    testing/         FixedClock, SequentialIds, InMemoryRateLimiter
  auth/              BetterAuth config, session lookup, requireUser()
  users/             getMe, updateMe, getProfile, searchUsers
  follows/           followUser, unfollowUser, listFollowers, listFollowing
  media/             createUpload, completeUpload, ports: MediaStorage (R2)
  posts/             createPost, getPost, updatePost, deletePost, listUserPosts
  feed/              listFeed, listReels
  reactions/         likePost, unlikePost, savePost, unsavePost, listSavedPosts
  comments/          listComments, listReplies, createComment, deleteComment
  stories/           createStory, listStoryTray, listUserStories, markStorySeen, likeStory, deleteStory
  reports/           reportPost, listReports, resolveReport
  preferences/       getPreferences, updatePreferences, ports: PreferencesCache (KV)
  jobs/              cleanup use cases ([6.9](#69-background-and-cleanup-work))
  db/                Drizzle client + schema
  container.ts       composition root
```

Each feature folder has `domain/`, `application/` and `infrastructure/` folders inside it. A use case file is named after its contract operation (`create-post.ts` exports `createPost`).

### 3.3 Request flow

```text
hooks.server.ts
  1. services = createContainer(platform.env, platform.ctx)       → locals.services
  2. BetterAuth session (KV first, D1 fallback)                    → locals.user, locals.session
  3. language: preferences.language → Accept-Language → 'en'      → locals.lang
  4. protected pages: no session → redirect to /login

+page.server.ts load / form action / +server.ts (adapter)
  1. parse input from params, form data or JSON
  2. call ONE use case: locals.services.posts.createPost(viewer, input)
  3. map the result: success → data / json; AppError → fail() / error() / json(status)

use case (application)
  1. validate input (domain)                      → VALIDATION_FAILED
  2. require viewer when 🔒                        → UNAUTHENTICATED
  3. rate limit (writes only)                     → RATE_LIMITED
  4. load target + access check                   → NOT_FOUND (never FORBIDDEN for "can't see")
  5. ownership / role check                       → FORBIDDEN
  6. write through repository (one db.batch)
  7. return a contract object (Post, Comment, …)
  8. side effects through TaskRunner (KV cache update, R2 delete)
```

Use **form actions** and **page loads** by default (contract line 7). Add a `+server.ts` only where the browser must call the server directly:

| Adapter                                          | Why                                         |
| ------------------------------------------------ | ------------------------------------------- |
| `POST /api/uploads`, `/api/uploads/:id/complete` | Browser uploads straight to R2              |
| `GET /api/feed`, `/api/reels`, list pagination   | Infinite scroll loads the next `nextCursor` |
| `/api/auth/*`                                    | Owned by BetterAuth                         |

### 3.4 Composition root

`container.ts` builds every adapter from `platform.env` (bindings exist only per request on Workers) and returns the use cases:

```ts
export function createContainer(env: Env, ctx: ExecutionContext) {
	const db = getDb(env.DB)
	const clock = new SystemClock()
	const ids = new PrefixedIdGenerator()
	const tasks = { run: (p: Promise<unknown>) => ctx.waitUntil(p) }
	const posts = new D1PostRepository(db)
	// …
	return {
		posts: {
			createPost: createPost({ posts, media, clock, ids, rateLimiter }),
			// …
		},
	}
}
```

Nothing else calls `getDb()` or creates infrastructure classes.

### 3.5 Errors

Use cases return contract objects or throw `AppError(code, message, fields?, retryAfterSec?)`. Only adapters turn them into HTTP:

| `code`                | HTTP | `code`                   | HTTP |
| --------------------- | ---- | ------------------------ | ---- |
| `VALIDATION_FAILED`   | 400  | `CONFLICT`               | 409  |
| `UNAUTHENTICATED`     | 401  | `PAYLOAD_TOO_LARGE`      | 413  |
| `INVALID_CREDENTIALS` | 401  | `UNSUPPORTED_MEDIA_TYPE` | 415  |
| `FORBIDDEN`           | 403  | `RATE_LIMITED`           | 429  |
| `EMAIL_NOT_VERIFIED`  | 403  | `INTERNAL`               | 500  |
| `NOT_FOUND`           | 404  |                          |      |

- One helper per transport: `toActionFailure(err)` → `fail(status, envelope)`, `toHttpError(err)` → `error(status, …)`, `toJsonError(err)` → `json(envelope, { status })`.
- Any other exception becomes `INTERNAL`. Log it; never send the real message to the browser.

---

## 4. Infrastructure

| What             | Binding / variable                                                 | Used by                                      | Status                                        |
| ---------------- | ------------------------------------------------------------------ | -------------------------------------------- | --------------------------------------------- |
| D1 database      | `DB`                                                               | everything                                   | ✅ in `wrangler.jsonc`                        |
| KV namespace     | `KV`                                                               | sessions (#12), preferences cache (#23)      | ✅ in `wrangler.jsonc`                        |
| R2 bucket        | `MEDIA` (binding) for head / range read / delete                   | upload check, cleanup                        | ❌ add `r2_buckets`                           |
| R2 S3 API keys   | `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`            | presigned `PUT` URLs (use `aws4fetch`)       | ❌ add to `.env.example`                      |
| R2 public domain | `MEDIA_PUBLIC_URL` (e.g. `https://cdn.sns.eykorban.me`)            | `Media.url`, `Media.thumbnailUrl`            | ❌                                            |
| R2 CORS rule     | allow `PUT` from the app origin, header `Content-Type`             | browser upload                               | ❌                                            |
| BetterAuth       | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID/SECRET` | auth                                         | ⚠️ `BETTER_AUTH_URL` missing                  |
| Email provider   | e.g. `RESEND_API_KEY`, `MAIL_FROM`                                 | verification, password reset                 | ❌ not chosen                                 |
| App origin       | `PUBLIC_APP_URL` (e.g. `https://sns.eykorban.me`)                  | `Post.shareUrl`, email links                 | ❌                                            |
| Cleanup job      | Cron Trigger                                                       | orphan media, deleted posts, deleted stories | ❌ see [6.9](#69-background-and-cleanup-work) |

Secrets go in `wrangler secret put` for production and `.dev.vars` locally. Never commit them.

---

## 5. Work list

Every contract operation, its use case folder, tables and owner issue. **Rows marked NEW need an issue.**

| Area                     | Operations                                                                                     | Feature folder | Tables                                       | Issue    |
| ------------------------ | ---------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------- | -------- |
| Auth setup, session hook | BetterAuth handler, `getSession`, `hooks.server.ts`, `requireUser`                             | `auth`         | `user`, `session`, `account`, `verification` | #10      |
| Sign-up / sign-in        | `signUp`, `signIn`, `signInWithGoogle`, `signOut`                                              | `auth`         | same + `rate_limit`                          | #11      |
| Sessions in KV           | BetterAuth `secondaryStorage`                                                                  | `auth`         | KV                                           | #12      |
| Reset, email verify      | `requestPasswordReset`, `resetPassword`, `verifyEmail`                                         | `auth`         | `verification`                               | #13      |
| **Me / profile**         | `getMe`, `updateMe`, `getProfile`                                                              | `users`        | `user`, `follows`, `posts`, `media`          | **NEW**  |
| **Follow**               | `followUser`, `unfollowUser`, `listFollowers`, `listFollowing`                                 | `follows`      | `follows`                                    | **NEW**  |
| **User search**          | `searchUsers`                                                                                  | `users`        | `user`                                       | **NEW**  |
| Upload                   | `createUpload`, `completeUpload`                                                               | `media`        | `media`                                      | #18      |
| Post model               | —                                                                                              | `posts`        | `posts`, `post_media`, `post_edits`          | #15      |
| Post CRUD                | `createPost`, `getPost`, `updatePost`, `deletePost`, `listUserPosts`                           | `posts`        | same                                         | #16      |
| Feed, reels, cursor      | `listFeed`, `listReels`                                                                        | `feed`         | `posts`, `follows`                           | #17      |
| **Like / save**          | `likePost`, `unlikePost`, `savePost`, `unsavePost`, `listSavedPosts`                           | `reactions`    | `likes`, `saves`                             | **NEW**  |
| **Comments**             | `listComments`, `listReplies`, `createComment`, `deleteComment`                                | `comments`     | `comments`                                   | **NEW**  |
| **Stories**              | `createStory`, `listStoryTray`, `listUserStories`, `markStorySeen`, `likeStory`, `deleteStory` | `stories`      | `stories`, `story_views`, `story_likes`      | **NEW**  |
| Reports                  | `reportPost`, `listReports`, `resolveReport` (proposed)                                        | `reports`      | `reports`                                    | #19      |
| Preferences              | `getPreferences`, `updatePreferences`                                                          | `preferences`  | `preferences`                                | #21, #22 |
| Preferences cache        | —                                                                                              | `preferences`  | KV                                           | #23      |
| Language                 | `updatePreferences { language }`, SSR language in hooks                                        | `preferences`  | `preferences`                                | #26      |
| Translation check        | `pnpm check:i18n` (`scripts/check-translations.js`)                                            | —              | —                                            | #27      |
| **Shared kernel**        | `AppError`, `Page`, cursor, clock, ids, rate limiter, mappers, error adapters, `container.ts`  | `shared`       | —                                            | **NEW**  |
| **Cleanup job**          | orphan media, deleted posts, deleted stories                                                   | `jobs`         | `media`, `posts`, `stories`                  | **NEW**  |

**Order**, so nobody waits:

1. **Shared kernel** + **#10** (auth, hooks, container).
2. **One migration** with every in-scope table ([`db-schema.md`](./db-schema.md)). One shared migration avoids conflicts in `drizzle/meta/_journal.json`.
3. In parallel: #11 / #13, #18, #21–#23, users/follow.
4. #16 (needs media), then #17, like/save, comments, stories, reports in parallel.
5. Cleanup job last.

---

## 6. Shared logic

Lives in `src/lib/server/shared/` and is reused by every feature.

### 6.1 IDs and time

- IDs: prefix + random, e.g. `pst_` + 21-char nanoid. `IdGenerator` port, so tests get predictable ids. BetterAuth uses the same generator via `advanced.database.generateId`.
- DB stores time as integer ms. Mappers turn it into ISO-8601 UTC strings. Domain code gets "now" from the `Clock` port, never `Date.now()`.

### 6.2 Access rules

| Object  | Viewer can see it when                                                                                 | Otherwise   |
| ------- | ------------------------------------------------------------------------------------------------------ | ----------- |
| Post    | `deleted_at IS NULL` and the author is not banned                                                      | `NOT_FOUND` |
| Profile | user exists, has a username, not banned                                                                | `NOT_FOUND` |
| Comment | its post is visible                                                                                    | `NOT_FOUND` |
| Story   | viewer is the author **or** follows the author, the author is not banned, and the story is not expired | `NOT_FOUND` |
| Media   | only the owner can complete or attach it; anyone can load its public URL once attached                 | `NOT_FOUND` |

Write the post rule **once** as a repository helper (a Drizzle `sql` fragment) and reuse it in feed, reels, profile posts, saved posts, single post and comments. Moderators bypass it only inside `listReports`.

### 6.3 Cursor pagination

- Cursor = base64url of `"<sortValueMs>:<id>"`. Bad base64 or format → `VALIDATION_FAILED`, `fields.cursor = "INVALID_FORMAT"`. Bad `limit` → `fields.limit = "INVALID_FORMAT"`.
- Newest first:

  ```sql
  WHERE (created_at < :t OR (created_at = :t AND id < :id))
  ORDER BY created_at DESC, id DESC
  LIMIT :limit + 1
  ```

  Oldest first (replies): flip `<` to `>` and `DESC` to `ASC`.

- Fetch `limit + 1` rows. If the extra row exists, drop it and build `nextCursor` from the last returned row; otherwise `nextCursor = null`.
- The `id` tie-breaker stops rows with the same millisecond being skipped or repeated.
- Saved posts page on `saves.created_at`. Followers / following page on `follows.created_at`. The story tray uses its own cursor ([7.9](#79-stories-new)).
- Cursor encode/decode is pure domain code with unit tests.

### 6.4 `viewer.*` fields without N+1 queries

For one page of posts, run **one** extra query each with `IN (:postIds)`:

- `likes WHERE user_id = :viewer AND post_id IN (…)` → `viewer.liked`
- `saves WHERE user_id = :viewer AND post_id IN (…)` → `viewer.saved`
- `post_media JOIN media WHERE post_id IN (…) ORDER BY position` → `media[]`

`viewer.isAuthor` = `author_id = viewer`. Logged out → skip the queries and use `false`. The same pattern applies to `following` in user lists and `seen` in stories.

### 6.5 Mappers

One mapper per contract object: `toUserSummary`, `toProfile`, `toMe`, `toFollowListItem`, `toMedia`, `toPost`, `toComment`, `toStory`, `toStoryTrayItem`, `toPreferences`, `toReport`. They turn ms into ISO strings, `NULL` username into `""`, `NULL` text into `""`, and R2 keys into `MEDIA_PUBLIC_URL` URLs. Database rows never leave infrastructure.

### 6.6 Rate limits

| Action                                                    | How to count                                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Sign-in, sign-up (3 / hour), password reset, resend email | BetterAuth `rateLimit` with `customRules`, `storage: "database"` (`rate_limit` table) |
| Create post / reel / story                                | `COUNT(*)` on `posts` + `stories` where `author_id = ? AND created_at > now − 1h`     |
| Create comment                                            | same on `comments`                                                                    |
| Report a post                                             | same on `reports` (index `reports_reporter_idx`)                                      |

Counting real rows needs no extra table and is always correct. `retryAfterSec` = time until the oldest counted row leaves the window. Behind a `RateLimiter` port, so use cases are tested with a fake.

### 6.7 Counters

D1 has no interactive transactions, so update counters **inside the same `db.batch`** as the write, and **recompute** instead of `+1 / −1`:

```sql
UPDATE posts SET like_count = (SELECT COUNT(*) FROM likes WHERE post_id = :id) WHERE id = :id
```

This keeps like/unlike idempotent (double clicks, retries) and fixes drift. Same for `comment_count` (all comments of a post) and `reply_count` (replies of one top-level comment). Profile counts are not stored; they are `COUNT(*)` on indexed tables.

### 6.8 Validation

All limits from contract 2.6 live in one domain module (`shared/domain/limits.ts`) with one validator per field. Text is trimmed and measured in Unicode characters (`[...text].length`). The frontend may import the same limits through `packages/types` later.

### 6.9 Background and cleanup work

| Job             | Rule                                                                                       | When                       |
| --------------- | ------------------------------------------------------------------------------------------ | -------------------------- |
| KV cache update | After a preferences write                                                                  | `TaskRunner` (`waitUntil`) |
| Deleted story   | Delete the R2 object and `media` row                                                       | `TaskRunner` after delete  |
| Orphan media    | `media.status IN ('pending', 'ready') AND created_at < now − 24h` → delete R2 object + row | Cron, hourly               |
| Old avatar      | Previous avatar media is set back to `ready` on change → swept by the orphan rule          | Cron, hourly               |
| Deleted posts   | `deleted_at < now − 30d` and no `open` report → delete R2 media, `media` rows, post row    | Cron, daily                |

`@sveltejs/adapter-cloudflare` does not export a `scheduled` handler. Use a small separate Worker with a Cron Trigger bound to the same D1 / R2, or a secret-protected `POST /api/internal/cleanup` called by a cron. Either way the job calls use cases in `jobs/`, so the logic is the same and unit-tested. Decide in [10](#10-decisions-needed-from-the-team).

---

## 7. Feature logic

### 7.1 Auth (#10, #11, #12, #13)

- BetterAuth plugins: **username**, **admin** (roles `user`, `moderator`, `admin` via its access-control option). Google is the social provider.
- `secondaryStorage` = KV (`get` / `set` / `delete` with BetterAuth's `ttl`). This is #12: session reads hit KV first; sign-out deletes the key.
- `emailVerification.sendOnSignUp: true`, `emailAndPassword.requireEmailVerification: true` → `signIn` fails with `EMAIL_NOT_VERIFIED` until verified.
- `emailVerification.autoSignInAfterVerification: true`: opening the link signs the user in, then redirects to `/login`, which sends signed-in users to `/` (or `/onboard` without a username). A bad or expired link redirects to `/login?error=invalid_token|token_expired` with a message and a resend form. Verification tokens last 1 hour (BetterAuth default).
- `emailVerification.sendOnSignIn: true`: a correct password on an unverified account sends a new link and still returns `EMAIL_NOT_VERIFIED`.
- `emailAndPassword.onExistingUserSignUp`: with `requireEmailVerification` on, BetterAuth returns a generic success for an existing email (anti-enumeration), so `signUp` never returns `CONFLICT` for `email`. An unverified account gets a new link; a verified one gets nothing. Signing up again never changes the existing password.
- Rate limits: `/sign-up/email` 3 / hour, `/send-verification-email` 3 / hour.
- Reset tokens expire in **1 hour** **(proposed)**. `requestPasswordReset` returns the same result whether or not the email exists.
- `databaseHooks.user.create.after`: insert the `preferences` row with `language = locals.lang`.
- `signUp { name, username }`: `name` becomes `displayName`; `username` follows contract 2.6.
- `requireUser(locals)` and `optionalViewer(locals)` live in `auth/` and return a domain `Viewer { id, role }`. Use cases never read cookies.
- The frontend auth repository maps BetterAuth errors to contract codes (contract 2.5). The backend keeps BetterAuth's error codes stable.

### 7.2 Me and profile (NEW)

- `getMe`: user row + counts + `email`, `emailVerified`. `viewer = { isMe: true, following: false }`.
- `updateMe` (partial):
  - `username`: contract regex, unique → `CONFLICT { username: "TAKEN" }`. Reserved names (`admin`, `api`, `login`, `settings`, `p`, …) → `NOT_ALLOWED`. Change limit [2.3 I](#23-should-clarify).
  - `displayName` 1–50, `bio` 0–160.
  - `avatarMediaId`: must be the viewer's, `purpose = 'avatar'`, `status = 'ready'` → else `VALIDATION_FAILED { avatarMediaId: "INVALID_FORMAT" }`. Set `image` = media URL, mark media `attached`, set the old avatar media back to `ready` (cleanup removes it). `null` → remove avatar.
- `getProfile`: access rule [6.2](#62-access-rules). `counts.posts` = non-deleted posts and reels. `counts.followers` / `following` = `COUNT(*)` on `follows`.

### 7.3 Follow and search (NEW)

- `followUser`: target missing → `NOT_FOUND`; target is self → `VALIDATION_FAILED { username: "NOT_ALLOWED" }`. `INSERT OR IGNORE`, return `{ following: true, followers }`.
- `unfollowUser`: `DELETE`, no error if not following. Returns `{ following: false, followers }`.
- `listFollowers` / `listFollowing`: page on `follows.created_at`, with `viewer.following` for each item ([6.4](#64-viewer-fields-without-n1-queries)).
- `searchUsers`: trim `q`, 1–50 chars, lower-case, escape `%` `_` `\`, then `username LIKE q% OR lower(name) LIKE q%`. Order: exact username match → users the viewer follows → others by username. Exclude banned users and users without a username.

### 7.4 Media upload (#18)

```text
createUpload { purpose, mimeType, sizeBytes }
  ├ mimeType allowed for purpose (reel → video only, avatar → image only) → UNSUPPORTED_MEDIA_TYPE
  ├ sizeBytes (image ≤ 10 MB, video ≤ 100 MB)                             → PAYLOAD_TOO_LARGE
  ├ insert media(status='pending', r2_key='<userId>/<mediaId>.<ext>')
  └ return presigned PUT URL (15 min) with Content-Type + Content-Length signed in

browser PUT → R2

completeUpload { mediaId, width, height, durationSec }
  ├ media is the viewer's and 'pending'                                   → NOT_FOUND
  ├ R2 head(): object exists, size == sizeBytes                           → VALIDATION_FAILED
  ├ R2 range read 0–31: magic bytes match mimeType (JPEG FFD8FF, PNG 89504E47,
  │   WebP RIFF....WEBP, MP4 ....ftyp, WebM 1A45DFA3)                    → UNSUPPORTED_MEDIA_TYPE, delete object
  ├ width/height 1–10000; durationSec required for video (reel/story ≤ 90 s, proposed)
  └ status='ready', return Media
```

- Signing `Content-Length` into the URL stops a user uploading a bigger file than declared.
- Width, height and duration come from the browser (Workers cannot decode video). They are range-checked and only affect layout.
- **Never trust the extension or `Content-Type`** (#18). Do not accept SVG, HTML or GIF.
- Ports: `MediaStorage { createUploadUrl, head, readRange, delete }` (R2 adapter) and `MediaRepository`. Magic-byte checks are pure domain functions.

### 7.5 Posts and reels (#15, #16)

`createPost { type, caption, mediaIds }`:

1. Validate: `caption` 0–2200; `type = post` → 0–10 media and (media > 0 **or** caption ≠ `""`); `type = reel` → exactly 1 video.
2. Rate limit: 30 / hour (posts + stories).
3. Every `mediaId`: owned by the viewer, `status = 'ready'`, `purpose` matches `type`, no duplicates. Any failure → `VALIDATION_FAILED { mediaIds: "INVALID_FORMAT" }`.
4. `db.batch`: insert `posts`, insert `post_media` with `position` = index, set media `status = 'attached'`.
5. Return `Post`.

`getPost`: access rule → `NOT_FOUND`.

`updatePost { id, caption }`: only `caption`; any other field (e.g. `mediaIds`) → `VALIDATION_FAILED { <field>: "NOT_ALLOWED" }`. Not visible → `NOT_FOUND`; not author → `FORBIDDEN`. Batch: insert old caption into `post_edits`, update caption, set `edited_at = now`.

`deletePost`: author only (moderators through `resolveReport`). Set `deleted_at = now`. Everything that joins posts hides it. Media is removed by the cleanup job after 30 days.

`listUserPosts { username, type? }`: profile access rule, then `author_id = :user` (+ `type`), newest first.

`shareUrl` = `${PUBLIC_APP_URL}/p/${id}`. The `/p/[id]` page calls `getPost`.

### 7.6 Feed and reels (#17)

| Operation                       | Filter (plus the post access rule)                                                          | Index              |
| ------------------------------- | ------------------------------------------------------------------------------------------- | ------------------ |
| `listFeed { scope: following }` | `author_id IN (SELECT followee_id FROM follows WHERE follower_id = :me) OR author_id = :me` | `posts_author_idx` |
| `listFeed { scope: all }`       | none                                                                                        | `posts_feed_idx`   |
| `listReels`                     | `type = 'reel'`                                                                             | `posts_reels_idx`  |
| `listUserPosts`                 | `author_id = :user` (+ `type`)                                                              | `posts_author_idx` |

- Newest first only. "Recommended" order is out of scope; the cursor format allows adding it later.
- `scope: following` when logged out → `UNAUTHENTICATED`.
- Performance check (#17): seed 10k posts and 500 users, run each query with `EXPLAIN QUERY PLAN`, and confirm it uses the index (no `SCAN posts`).

### 7.7 Like and save (NEW)

| Operation        | Logic                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `likePost`       | access rule → batch: `INSERT OR IGNORE likes`, recompute `like_count` → `{ liked: true, likes }` |
| `unlikePost`     | access rule → batch: `DELETE likes`, recompute → `{ liked: false, likes }`                       |
| `savePost`       | access rule → `INSERT OR IGNORE saves` → `{ saved: true }`                                       |
| `unsavePost`     | access rule → `DELETE saves` → `{ saved: false }`                                                |
| `listSavedPosts` | `saves JOIN posts` with the access rule, page on `saves.created_at` (newest saved first)         |

Share has no server operation (contract 4.5).

### 7.8 Comments (NEW)

`createComment { postId, body, parentId }`:

```text
post passes the access rule                         → NOT_FOUND
body trimmed, 1–500 chars                           → VALIDATION_FAILED
rate limit 60 / hour                                → RATE_LIMITED
if parentId is null:  top = null, replyToUser = null
else:
  p = comment parentId, must belong to this post    → NOT_FOUND
  if p.parent_id is null:  top = p,           replyToUser = null
  else:                    top = p.parent_id, replyToUser = p.author
store parent_id = top.id
store reply_to_comment_id = p.id (null for a top-level comment)
batch: insert comment
       recompute top.reply_count (if reply)
       recompute post.comment_count
```

The flatten rule is a pure domain function (`resolveParent(parent) → { topId, replyToUserId, replyToCommentId }`) with its own unit tests.

`deleteComment`: comment author **or** post author → else `FORBIDDEN`. Deleting a top-level comment first promotes its replies to top-level comments, then deletes only the target. Recompute `comment_count` and the parent's `reply_count` in the same batch.

`viewer.canDelete` = viewer is the comment author or the post author. Other users cannot delete the post author’s comments, including indirectly through parent deletion.

Lists: `listComments` = `parent_id IS NULL`, newest first. `listReplies` = `parent_id = :id`, oldest first.

### 7.9 Stories (NEW)

- `createStory { mediaId }`: media owned, `purpose = 'story'`, `ready`. Any `caption` key → `VALIDATION_FAILED { caption: "NOT_ALLOWED" }`. Rate limit 30 / hour (with posts). Batch: insert story, media `attached`.
- Access rule: author or follower ([6.2](#62-access-rules)), and `expires_at > now` (24 h after creation). Expired stories behave as `NOT_FOUND`.
- `likeStory { id, active }`: access rule → `INSERT OR IGNORE` / `DELETE` on `story_likes` → `{ liked, likes }`.
- `listStoryTray`: users = viewer + people the viewer follows who have at least one story. For each: `hasUnseen` = any story without a `story_views` row for the viewer; `latestAt` = newest story time; `storyCount` = number of active stories. Sort: viewer first → `hasUnseen` → `latestAt` desc → user id. The cursor encodes `(isMe, hasUnseen, latestAtMs, userId)`.
- `listUserStories { username }`: access rule → `{ items }`, oldest first. Not allowed → `NOT_FOUND`.
- `markStorySeen { id }`: access rule → `INSERT OR IGNORE story_views` (also for your own story).
- `deleteStory { id }`: author only → else `FORBIDDEN`. Delete the row (views cascade), then delete the R2 object and `media` row through `TaskRunner`.

### 7.10 Reports (#19)

Proposed contract section 4.9:

| Operation       | Auth         | Input                                       | Result               | Errors                                       |
| --------------- | ------------ | ------------------------------------------- | -------------------- | -------------------------------------------- |
| `reportPost`    | 🔒           | `{ postId, reason, note }`                  | `{ reported: true }` | `VALIDATION_FAILED`, `NOT_FOUND`, `CONFLICT` |
| `listReports`   | 🔒 moderator | `{ status?: "open", cursor?, limit? }`      | `Page<Report>`       | `FORBIDDEN`                                  |
| `resolveReport` | 🔒 moderator | `{ id, status: "dismissed" \| "actioned" }` | `Report`             | `FORBIDDEN`, `NOT_FOUND`                     |

```ts
Report {
  id: string
  post: Post              // includes soft-deleted posts for moderators
  reporter: UserSummary
  reason: 'spam' | 'nudity' | 'violence' | 'harassment' | 'hate' | 'false_info' | 'other'
  note: string
  status: 'open' | 'dismissed' | 'actioned'
  createdAt: string
  reviewedAt: string | null
}
```

- `note` 0–500. Reporting your own post → `VALIDATION_FAILED { postId: "NOT_ALLOWED" }`.
- One report per user per post (unique index) → `CONFLICT`. Rate limit 10 / hour.
- `actioned` soft-deletes the post in the same batch and records `reviewed_by`, `reviewed_at`.
- Role check uses `Viewer.role`; `user` → `FORBIDDEN`.

### 7.11 Preferences and language (#21, #22, #23, #26)

- `Preferences` = `{ theme, language, updatedAt }` only (contract 3.6).
- Storage (#21): **D1 is the source of truth, KV is a read cache** (`pref:<userId>`, TTL 1 day), behind a `PreferencesCache` port.
- `getPreferences`: KV → on miss D1 (or defaults if no row, and create the row), then write KV through `TaskRunner`.
- `updatePreferences` (partial): `theme` in the enum; `language` passes `isSupported()` from `src/lib/i18n/config.ts` (logic already in `src/lib/server/settings/language.ts`, move it to `preferences/domain/`). Update D1, then **overwrite** KV so the next read is a hit.
- Defaults: `theme: "system"`, `language` = `locals.lang` at sign-up.
- SSR language (#26): in `hooks.server.ts`, logged in → `preferences.language`; else `Accept-Language`; else `en`. Use `SUPPORTED_LANGS`, not a copied list.

---

## 8. Deferred features

Not in the contract. Do **not** build these until the team updates the contract. The design is kept here so the issues are not lost.

### 8.1 Notifications (#28–#32)

- Contract additions needed: a `Notification` object, operations `listNotifications`, `getUnreadCount`, `markNotificationRead`, `markAllNotificationsRead`, and `notifications: { inApp, email }` in `Preferences` (#31).
- Table: `notifications` (kept in [`db-schema.md`](./db-schema.md) section 5, not in the first migration).

| Event             | Recipient(s)                                                                                         | Type              | `dedupe_key`            |
| ----------------- | ---------------------------------------------------------------------------------------------------- | ----------------- | ----------------------- |
| Like post         | post author                                                                                          | `like`            | `like:<actor>:<post>`   |
| Follow            | followed user                                                                                        | `follow`          | `follow:<actor>:<user>` |
| Top-level comment | post author                                                                                          | `comment`         | `NULL`                  |
| Reply             | parent comment author and `replyToUser` get `reply`; post author gets `comment` only if not notified | `reply`/`comment` | `NULL`                  |

- Never notify the actor. One notification per person per event.
- Created through `TaskRunner` after the like / follow / comment write, via a `Notifier` port, so those use cases do not change when notifications are switched on (they call `notifier.notify(event)`; the default implementation does nothing).
- `INSERT … ON CONFLICT(dedupe_key) DO NOTHING` → like → unlike → like creates one notification (#30).
- Read API (#32): list newest first; deleted posts become `post: null`; unread count uses the partial index; mark-read must be the recipient's → else `NOT_FOUND`.
- Cleanup: delete read notifications older than 90 days **(proposed)**.

### 8.2 Accessibility preferences (#24)

- Proposed fields: `reducedMotion: boolean`, `fontScale: 'sm' | 'md' | 'lg' | 'xl'`. Add them to contract 3.6 first, then to the `preferences` table.

---

## 9. Testing

Rules are in [`CLAUDE.md`](../CLAUDE.md) section 4. What that means for each part of the backend:

| Part                        | Test type                     | What to cover                                                                                     |
| --------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------- |
| Domain (validation, rules)  | Unit                          | Every limit in contract 2.6 at its boundaries; flatten rule; magic bytes; cursor encode/decode    |
| Use cases                   | Unit with in-memory fakes     | Success path and every error code in the contract table for that operation                        |
| Mappers                     | Unit                          | ms → ISO, `NULL` → `""`, R2 key → URL, `viewer.*` flags                                           |
| Error adapters              | Unit                          | Every code → HTTP status; unknown error → `INTERNAL` without leaking the message                  |
| Repositories (Drizzle + D1) | Integration (optional)        | Access rule, pagination order and tie-breaker, counter recompute. Run against a local D1 database |
| Pages and flows             | E2E (Playwright, `tests/e2e`) | Sign-up → post → like → comment → delete                                                          |
| Feed performance (#17)      | Script                        | `EXPLAIN QUERY PLAN` uses the indexes                                                             |

Fakes live in `shared/testing/` and `<feature>/application/testing/` (e.g. `InMemoryPostRepository`, `FakeMediaStorage`, `FixedClock`). Coverage targets and the pre-PR gate are in `CLAUDE.md` sections 4 and 6.

---

## 10. Decisions needed from the team

Answer these in the contract PR, then update `api-contract.md` and this file.

1. Create issues for the **NEW** rows in [5](#5-work-list), and pick owners.
2. Add the report operations ([7.10](#710-reports-19)) to the contract.
3. Notifications (#28–#32): close the issues, or add notifications back to the contract ([8.1](#81-notifications-2832)).
4. Accessibility preferences (#24): add to the contract or drop ([8.2](#82-accessibility-preferences-24)).
5. Video poster upload flow ([2.2 C](#22-still-open--must-fix-before-the-backend-starts)).
6. Email provider ([2.2 E](#22-still-open--must-fix-before-the-backend-starts)).
7. `EMAIL_NOT_VERIFIED` only at sign-in? ([2.3 F](#23-should-clarify))
8. ~~Stories without expiry~~ Resolved: stories expire after 24 h ([2.3 M](#23-should-clarify)).
9. How the cleanup cron runs ([6.9](#69-background-and-cleanup-work)).
10. All values marked **(proposed)** in this file and in the contract.
