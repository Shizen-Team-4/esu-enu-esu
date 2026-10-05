# Database Schema (proposal)

Issues: #15 (posts), #21 (preferences), plus tables the contract needs but no issue owns yet. In-app notifications (#29) are included through an additive migration (section 5.1). Status: **proposal for team review**.

This is the D1 (SQLite) schema that backs every shape in [`api-contract.md`](./api-contract.md). It is written in Drizzle so it can be copied into `src/lib/server/db/schema.ts` as-is. It type-checks against `drizzle-orm@0.45.3` and `pnpm db:generate` produces a valid 17-table migration from it (section 3). Section 5 holds tables for deferred features; they are **not** part of the first migration.

Related: [`backend-requirements.md`](./backend-requirements.md) explains the rules and logic that use these tables. Only infrastructure code (repositories) imports this schema; see `CLAUDE.md` section 1.

## 1. Design rules

| Rule                                                                                                  | Why                                                                                                                              |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| IDs are `text` with a type prefix (`usr_`, `pst_`, `med_`, `cmt_`, `sty_`, `rpt_`)                    | Contract 2.1. BetterAuth also creates `user` / `session` rows, so set `advanced.database.generateId` to add the prefix per model |
| Times are `integer` milliseconds (`timestamp_ms`). The API converts them to ISO strings               | Sorts and compares fast; cursors use `(createdAt, id)`                                                                           |
| Column names are `snake_case` in SQL, `camelCase` in TypeScript                                       | Drizzle maps them; the API uses camelCase                                                                                        |
| `text(..., { enum })` is checked **in code only**                                                     | SQLite has no enum type, and Drizzle does not add `CHECK` constraints. Validate before insert                                    |
| Like and comment counts are stored on `posts`. Follower, following and post counts are **not** stored | Post counts appear on every feed card. Profile counts appear on one page and are cheap `COUNT(*)` queries on indexed tables      |
| Posts are soft-deleted (`deleted_at`). Other rows are hard-deleted with `ON DELETE CASCADE`           | #15 asks how to keep history. A deleted post returns `404`, but moderators can still see reported content                        |
| D1 has no interactive transactions. Use `db.batch([...])` for writes that must succeed together       | A batch runs as one transaction                                                                                                  |

## 2. Tables

```text
user ─┬─< session, account                 (BetterAuth)
      ├─< media ─┬─ post_media >─ posts ─┬─< likes, saves, comments, reports, post_edits
      │          └─ stories ─< story_views, story_likes
      ├─< follows (follower_id, followee_id)
      └── preferences (1 : 1)
rate_limit, verification                   (BetterAuth, not linked to user)
```

| Table                                        | Contract object / operations                                                     | Owner issue   |
| -------------------------------------------- | -------------------------------------------------------------------------------- | ------------- |
| `user`, `session`, `account`, `verification` | `Me`, `Profile`, `UserSummary`, auth operations (4.1), `getMe`, `updateMe`       | #10, #11, #13 |
| `rate_limit`                                 | BetterAuth rate limits for sign-in and password reset (contract 2.7)             | #11           |
| `media`                                      | `Media`, `createUpload`, `completeUpload`                                        | #18           |
| `posts`, `post_media`, `post_edits`          | `Post`, post operations (4.4), `listFeed`, `listReels`                           | #15, #16, #17 |
| `follows`                                    | follow operations (4.2), `Profile.viewer.following`, story access                | **none yet**  |
| `likes`, `saves`                             | like / save operations (4.5), `Post.viewer.liked/saved`                          | **none yet**  |
| `comments`                                   | `Comment`, comment operations (4.6)                                              | **none yet**  |
| `stories`, `story_views`, `story_likes`      | `Story`, `StoryTrayItem`, story operations (4.7)                                 | **none yet**  |
| `reports`                                    | `reportPost`, `listReports`, `resolveReport` (proposed, not in the contract yet) | #19           |
| `preferences`                                | `Preferences`, `getPreferences`, `updatePreferences`                             | #21, #22, #26 |

## 3. Drizzle code

```ts
import { sql } from 'drizzle-orm'
import {
	sqliteTable,
	text,
	integer,
	real,
	primaryKey,
	index,
	uniqueIndex,
	type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core'

const ts = (name: string) => integer(name, { mode: 'timestamp_ms' })
const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`

// ─── BetterAuth (core + username + admin plugins) ────────────────────────────
// Column names must match what BetterAuth expects. Regenerate with
// `npx @better-auth/cli generate` after changing plugins and compare.

export const user = sqliteTable(
	'user',
	{
		id: text('id').primaryKey(), // usr_…
		name: text('name').notNull(), // = displayName
		email: text('email').notNull().unique(),
		emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
		image: text('image'), // = avatarUrl
		createdAt: ts('created_at').notNull().default(now),
		updatedAt: ts('updated_at').notNull().default(now),
		// username plugin. NULL until an OAuth user picks one (API returns "")
		username: text('username').unique(),
		displayUsername: text('display_username'),
		// admin plugin (moderators for reports, #19)
		role: text('role', { enum: ['user', 'moderator', 'admin'] })
			.notNull()
			.default('user'),
		banned: integer('banned', { mode: 'boolean' }).notNull().default(false),
		banReason: text('ban_reason'),
		banExpires: ts('ban_expires'),
		// app fields (BetterAuth `user.additionalFields`, input: false)
		bio: text('bio').notNull().default(''),
		avatarMediaId: text('avatar_media_id'),
	},
	(t) => [index('user_name_idx').on(t.name)],
)

export const session = sqliteTable(
	'session',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		token: text('token').notNull().unique(),
		expiresAt: ts('expires_at').notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		impersonatedBy: text('impersonated_by'),
		createdAt: ts('created_at').notNull().default(now),
		updatedAt: ts('updated_at').notNull().default(now),
	},
	(t) => [index('session_user_idx').on(t.userId)],
)

export const account = sqliteTable(
	'account',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(), // 'credential' | 'google'
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: ts('access_token_expires_at'),
		refreshTokenExpiresAt: ts('refresh_token_expires_at'),
		scope: text('scope'),
		password: text('password'), // hash, credential accounts only
		createdAt: ts('created_at').notNull().default(now),
		updatedAt: ts('updated_at').notNull().default(now),
	},
	(t) => [index('account_user_idx').on(t.userId)],
)

export const verification = sqliteTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: ts('expires_at').notNull(),
		createdAt: ts('created_at').notNull().default(now),
		updatedAt: ts('updated_at').notNull().default(now),
	},
	(t) => [index('verification_identifier_idx').on(t.identifier)],
)

// ─── Media (#18) ─────────────────────────────────────────────────────────────

export const media = sqliteTable(
	'media',
	{
		id: text('id').primaryKey(), // med_…
		ownerId: text('owner_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		purpose: text('purpose', { enum: ['post', 'reel', 'story', 'avatar'] }).notNull(),
		type: text('type', { enum: ['image', 'video'] }).notNull(),
		mimeType: text('mime_type').notNull(),
		sizeBytes: integer('size_bytes').notNull(),
		r2Key: text('r2_key').notNull().unique(),
		thumbnailR2Key: text('thumbnail_r2_key'), // video poster, uploaded by the browser
		status: text('status', { enum: ['pending', 'ready', 'attached'] })
			.notNull()
			.default('pending'),
		width: integer('width'),
		height: integer('height'),
		durationSec: real('duration_sec'),
		createdAt: ts('created_at').notNull().default(now),
	},
	(t) => [
		index('media_owner_idx').on(t.ownerId, t.createdAt),
		index('media_cleanup_idx').on(t.status, t.createdAt), // orphan sweep
	],
)

// ─── Posts and reels (#15, #16, #17) ─────────────────────────────────────────

export const posts = sqliteTable(
	'posts',
	{
		id: text('id').primaryKey(), // pst_…
		authorId: text('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		type: text('type', { enum: ['post', 'reel'] }).notNull(),
		caption: text('caption').notNull().default(''),
		likeCount: integer('like_count').notNull().default(0),
		commentCount: integer('comment_count').notNull().default(0), // includes replies
		createdAt: ts('created_at').notNull().default(now),
		editedAt: ts('edited_at'),
		deletedAt: ts('deleted_at'), // soft delete; API treats as 404
	},
	(t) => [
		index('posts_author_idx').on(t.authorId, t.createdAt, t.id), // profile grid, following feed
		index('posts_feed_idx').on(t.createdAt, t.id), // listFeed scope: all
		index('posts_reels_idx').on(t.type, t.createdAt, t.id), // listReels
	],
)

export const postMedia = sqliteTable(
	'post_media',
	{
		postId: text('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		mediaId: text('media_id')
			.notNull()
			.unique() // one media → one post
			.references(() => media.id),
		position: integer('position').notNull(), // 0-based gallery order
	},
	(t) => [primaryKey({ columns: [t.postId, t.position] })],
)

// Previous captions, written on every updatePost (#15 "edit history").
export const postEdits = sqliteTable(
	'post_edits',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		postId: text('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		caption: text('caption').notNull(),
		replacedAt: ts('replaced_at').notNull().default(now),
	},
	(t) => [index('post_edits_post_idx').on(t.postId, t.replacedAt)],
)

// ─── Social graph ────────────────────────────────────────────────────────────

export const follows = sqliteTable(
	'follows',
	{
		followerId: text('follower_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		followeeId: text('followee_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: ts('created_at').notNull().default(now),
	},
	(t) => [
		primaryKey({ columns: [t.followerId, t.followeeId] }), // also serves "following" list
		index('follows_followee_idx').on(t.followeeId, t.createdAt), // "followers" list
	],
)

export const likes = sqliteTable(
	'likes',
	{
		postId: text('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: ts('created_at').notNull().default(now),
	},
	(t) => [
		primaryKey({ columns: [t.postId, t.userId] }),
		index('likes_user_idx').on(t.userId), // viewer.liked lookups
	],
)

export const saves = sqliteTable(
	'saves',
	{
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		postId: text('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		createdAt: ts('created_at').notNull().default(now),
	},
	(t) => [
		primaryKey({ columns: [t.userId, t.postId] }),
		index('saves_list_idx').on(t.userId, t.createdAt), // listSavedPosts
	],
)

// ─── Comments (2 levels, flatten rule) ───────────────────────────────────────

export const comments = sqliteTable(
	'comments',
	{
		id: text('id').primaryKey(), // cmt_…
		postId: text('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		authorId: text('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		// always a TOP-LEVEL comment id, or NULL. Cascade = deleting a comment deletes its replies
		parentId: text('parent_id').references((): AnySQLiteColumn => comments.id, {
			onDelete: 'cascade',
		}),
		replyToCommentId: text('reply_to_comment_id').references((): AnySQLiteColumn => comments.id, {
			onDelete: 'set null',
		}),
		replyToUserId: text('reply_to_user_id').references(() => user.id, {
			onDelete: 'set null',
		}),
		body: text('body').notNull(),
		replyCount: integer('reply_count').notNull().default(0),
		createdAt: ts('created_at').notNull().default(now),
	},
	(t) => [
		index('comments_post_idx').on(t.postId, t.parentId, t.createdAt, t.id),
		index('comments_parent_idx').on(t.parentId, t.createdAt, t.id),
	],
)

// ─── Stories ─────────────────────────────────────────────────────────────────

export const stories = sqliteTable(
	'stories',
	{
		id: text('id').primaryKey(), // sty_…
		authorId: text('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		mediaId: text('media_id')
			.notNull()
			.unique()
			.references(() => media.id),
		createdAt: ts('created_at').notNull().default(now),
		expiresAt: ts('expires_at').notNull(), // created_at + 24 h; expired rows are filtered out
	},
	(t) => [index('stories_author_idx').on(t.authorId, t.createdAt, t.id)], // tray, listUserStories
)

export const storyViews = sqliteTable(
	'story_views',
	{
		storyId: text('story_id')
			.notNull()
			.references(() => stories.id, { onDelete: 'cascade' }),
		viewerId: text('viewer_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		seenAt: ts('seen_at').notNull().default(now),
	},
	(t) => [primaryKey({ columns: [t.storyId, t.viewerId] })],
)

export const storyLikes = sqliteTable(
	'story_likes',
	{
		storyId: text('story_id')
			.notNull()
			.references(() => stories.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: ts('created_at').notNull().default(now),
	},
	(t) => [primaryKey({ columns: [t.storyId, t.userId] })],
)

// ─── Reports (#19) ───────────────────────────────────────────────────────────

export const reports = sqliteTable(
	'reports',
	{
		id: text('id').primaryKey(), // rpt_…
		postId: text('post_id')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		reporterId: text('reporter_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		reason: text('reason', {
			enum: ['spam', 'nudity', 'violence', 'harassment', 'hate', 'false_info', 'other'],
		}).notNull(),
		note: text('note').notNull().default(''),
		status: text('status', { enum: ['open', 'dismissed', 'actioned'] })
			.notNull()
			.default('open'),
		reviewedBy: text('reviewed_by').references(() => user.id, { onDelete: 'set null' }),
		reviewedAt: ts('reviewed_at'),
		createdAt: ts('created_at').notNull().default(now),
	},
	(t) => [
		uniqueIndex('reports_once_idx').on(t.postId, t.reporterId), // → 409 CONFLICT
		index('reports_queue_idx').on(t.status, t.createdAt), // moderator queue
		index('reports_reporter_idx').on(t.reporterId, t.createdAt), // rate limit
	],
)

// ─── Preferences (#21, #22, #26) ─────────────────────────────────────────────

export const preferences = sqliteTable('preferences', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	theme: text('theme', { enum: ['system', 'light', 'dark'] })
		.notNull()
		.default('system'),
	language: text('language', { enum: ['en', 'km', 'ja'] })
		.notNull()
		.default('en'),
	updatedAt: ts('updated_at').notNull().default(now),
})

// ─── BetterAuth rate limit (contract 2.7, storage: "database") ──────────────
// Compare with `npx @better-auth/cli generate`; map the model name to this table if needed.

export const rateLimit = sqliteTable('rate_limit', {
	id: text('id').primaryKey(),
	key: text('key').notNull().unique(),
	count: integer('count').notNull(),
	lastRequest: integer('last_request').notNull(), // ms
})
```

## 4. Notes per table

### `user` (BetterAuth)

- `name` is the contract's `displayName`. `image` is `avatarUrl`. When the user sets an avatar, write the media URL into `image` and the id into `avatar_media_id`.
- `username` is **nullable**. A new Google user has no username. The API returns `""` (contract 4.1), but the DB must store `NULL`, because a `UNIQUE` column allows many `NULL`s but only one `""`.
- `role`, `banned`, `ban_*` come from the BetterAuth **admin plugin**. `moderator` is needed so someone can review reports (#19).
- BetterAuth's CLI (`npx @better-auth/cli generate`) can print its expected columns. Compare after installing plugins. If BetterAuth's names differ, BetterAuth wins.

### `media`

- `status`: `pending` (URL issued) → `ready` (`/complete` passed) → `attached` (used by a post, story or avatar). A cleanup job deletes `pending` / `ready` rows older than 24 h together with their R2 objects.
- `purpose` must match how it is used: `story` media only in `createStory`, `avatar` only in `updateMe`, `reel` only in `type: "reel"` posts.
- `thumbnail_r2_key`: Workers cannot run ffmpeg, so the **browser** captures a poster frame of a video and uploads it. See open item C in `backend-requirements.md` 2.2.

### `posts`, `post_media`, `post_edits`

- `post_media.media_id` is `UNIQUE`, so one media can never be attached to two posts.
- `post_edits` stores the **old** caption each time a post is edited. There is no visibility column: all posts are public (contract 3.3).
- Index `(author_id, created_at, id)` serves both the profile grid and the following feed. `(created_at, id)` serves `scope: all`. `(type, created_at, id)` serves reels.

### `comments`

- `parent_id` always points to a **top-level** comment (flatten rule). Its `ON DELETE CASCADE` deletes replies with their parent.
- `reply_to_comment_id` retains the exact answered comment for branch expansion. Deleting that target sets this reference to null. Comment deletion promotes replies before deleting their root, preserving their content. Legacy comments have a null exact target and remain flat.
- SQLite only enforces cascades when `PRAGMA foreign_keys = ON`. D1 enables it by default. Do not turn it off in migrations.

### `stories`, `story_views`, `story_likes`

- Stories **expire after 24 h** (contract 3.5). `expires_at` = `created_at` + 24 h; every story query filters `expires_at > now`. Deleting a story cascades to `story_views` and `story_likes`, and the app deletes its media row and R2 object.
- `story_likes` has one row per user per story (`story_id`, `user_id`, `created_at`). `INSERT OR IGNORE` / `DELETE` make `likeStory` idempotent.
- `story_views` has one row per viewer per story. `INSERT OR IGNORE` makes `markStorySeen` idempotent.

### `rate_limit`

- Used only by BetterAuth for sign-in and password reset limits. App limits (posts, comments, reports) count rows in their own tables instead (`backend-requirements.md` 6.6).

### `preferences`

- Created right after the user (BetterAuth `databaseHooks.user.create.after`). If a row is missing, `getPreferences` returns defaults and creates the row.
- Only `theme` and `language`, matching contract 3.6. Notification and accessibility settings are deferred (section 5).

## 5. Deferred tables

Not part of the first migration. In-app notifications now have their own additive migration after being included in contract 4.9. Other deferred additions require contract approval (`backend-requirements.md` section 8).

### 5.1 Notifications (#29, #30, #32, now in scope)

Contract 4.9 brings this table into scope. Add it after the existing migrations; other tables in section 5 remain deferred.

```ts
// ─── Notifications (#29, #30, #32) ───────────────────────────────────────────

export const notifications = sqliteTable(
	'notifications',
	{
		id: text('id').primaryKey(), // ntf_…
		recipientId: text('recipient_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		type: text('type', { enum: ['post', 'like', 'comment', 'reply', 'follow'] }).notNull(),
		actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
		postId: text('post_id').references(() => posts.id, { onDelete: 'set null' }),
		commentId: text('comment_id').references(() => comments.id, { onDelete: 'set null' }),
		dedupeKey: text('dedupe_key').notNull().unique(),
		readAt: ts('read_at'),
		createdAt: ts('created_at').notNull().default(now),
	},
	(t) => [
		index('notifications_list_idx').on(t.recipientId, t.createdAt, t.id),
		index('notifications_unread_idx')
			.on(t.recipientId)
			.where(sql`${t.readAt} IS NULL`),
	],
)
```

- IDs use the prefix `ntf_`.
- `dedupe_key` is required and unique: `like:<actor>:<post>`, `follow:<actor>:<recipient>`, `post:<post>:<recipient>` or `comment:<comment>:<recipient>`. Likes/follows dedupe for the lifetime of the pair; post/comment keys make background delivery idempotent without merging separate events.
- The partial index `WHERE read_at IS NULL` keeps the unread count fast.
- Notification settings (#31) and email remain deferred; the current notification feature does not change `preferences`.

### 5.2 Accessibility preferences (#24)

Add to `preferences`:

```ts
reducedMotion: integer('reduced_motion', { mode: 'boolean' }).notNull().default(false),
fontScale: text('font_scale', { enum: ['sm', 'md', 'lg', 'xl'] }).notNull().default('md'),
```
