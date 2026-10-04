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
		expiresAt: ts('expires_at').notNull(),
	},
	(t) => [
		index('stories_author_idx').on(t.authorId, t.createdAt, t.id),
		index('stories_expiry_idx').on(t.expiresAt),
	],
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
