import { sql } from 'drizzle-orm'
import type { getDb } from '../../db'
import { AppError } from '../../shared/domain/app-error'
import { encodeCursor } from '../../shared/domain/cursor'
import type { PostRepository } from '../application/ports'
import type { Media } from '../domain/post'
import { toPost, type PostRow } from './post-mapper'

const columns = sql`p.id, p.type, p.caption, p.author_id AS authorId, u.username, u.name, u.image,
	p.like_count AS likeCount, p.comment_count AS commentCount, p.created_at AS createdAt, p.edited_at AS editedAt`
type MediaRow = {
	postId: string
	id: string
	type: 'image' | 'video'
	key: string
	thumbnail: string | null
	width: number
	height: number
	duration: number | null
}

export function createPostRepository(
	db: ReturnType<typeof getDb>,
	d1: D1Database,
	urls: { origin: string; media: string },
): PostRepository {
	async function hydrate(rows: PostRow[], viewerId: string | null) {
		if (!rows.length) return []
		const ids = sql.join(
			rows.map((row) => sql`${row.id}`),
			sql`, `,
		)
		const [media, liked, saved] = await Promise.all([
			db.all<MediaRow>(
				sql`SELECT pm.post_id AS postId, m.id, m.type, m.r2_key AS key, m.thumbnail_r2_key AS thumbnail, m.width, m.height, m.duration_sec AS duration FROM post_media pm JOIN media m ON m.id = pm.media_id WHERE pm.post_id IN (${ids}) ORDER BY pm.position`,
			),
			viewerId
				? db.all<{ id: string }>(
						sql`SELECT post_id AS id FROM likes WHERE user_id = ${viewerId} AND post_id IN (${ids})`,
					)
				: [],
			viewerId
				? db.all<{ id: string }>(
						sql`SELECT post_id AS id FROM saves WHERE user_id = ${viewerId} AND post_id IN (${ids})`,
					)
				: [],
		])
		const likedIds = new Set(liked.map((row) => row.id))
		const savedIds = new Set(saved.map((row) => row.id))
		const mediaByPost = new Map<string, Media[]>()
		for (const row of media) {
			const items = mediaByPost.get(row.postId) ?? []
			items.push({
				id: row.id,
				type: row.type,
				url: `${urls.media}/${row.key}`,
				thumbnailUrl: row.thumbnail ? `${urls.media}/${row.thumbnail}` : null,
				width: row.width,
				height: row.height,
				durationSec: row.duration,
			})
			mediaByPost.set(row.postId, items)
		}
		return rows.map((row) =>
			toPost(row, {
				media: mediaByPost.get(row.id) ?? [],
				liked: likedIds.has(row.id),
				saved: savedIds.has(row.id),
				viewerId,
				origin: urls.origin,
			}),
		)
	}
	return {
		async find(id, viewerId) {
			const rows = await db.all<PostRow>(
				sql`SELECT ${columns} FROM posts p JOIN user u ON u.id = p.author_id WHERE p.id = ${id} AND p.deleted_at IS NULL AND u.banned = 0`,
			)
			return (await hydrate(rows, viewerId))[0] ?? null
		},
		async list(input) {
			const saved = input.scope === 'saved'
			const sort = saved ? sql`s.created_at` : sql`p.created_at`
			const conditions = [sql`p.deleted_at IS NULL`, sql`u.banned = 0`]
			if (saved) conditions.push(sql`s.user_id = ${input.viewerId}`)
			if (input.scope === 'following')
				conditions.push(
					sql`(p.author_id = ${input.viewerId} OR EXISTS (SELECT 1 FROM follows WHERE follower_id = ${input.viewerId} AND followee_id = p.author_id))`,
				)
			if (input.type) conditions.push(sql`p.type = ${input.type}`)
			if (input.authorId) conditions.push(sql`p.author_id = ${input.authorId}`)
			if (input.cursor)
				conditions.push(
					sql`(${sort} < ${input.cursor.time} OR (${sort} = ${input.cursor.time} AND p.id < ${input.cursor.id}))`,
				)
			const rows = await db.all<PostRow & { sortTime: number }>(
				sql`SELECT ${columns}, ${sort} AS sortTime FROM posts p JOIN user u ON u.id = p.author_id ${saved ? sql`JOIN saves s ON s.post_id = p.id` : sql``} WHERE ${sql.join(conditions, sql` AND `)} ORDER BY ${sort} DESC, p.id DESC LIMIT ${input.limit + 1}`,
			)
			const page = rows.slice(0, input.limit)
			const last = page.at(-1)
			return {
				items: await hydrate(page, input.viewerId),
				nextCursor:
					rows.length > input.limit && last
						? encodeCursor({ time: last.sortTime, id: last.id })
						: null,
			}
		},
		async checkMedia(ids, ownerId, type) {
			if (!ids.length) return type === 'post'
			const rows = await db.all<{ id: string }>(
				sql`SELECT id FROM media WHERE id IN (${sql.join(
					ids.map((id) => sql`${id}`),
					sql`, `,
				)}) AND owner_id = ${ownerId} AND status = 'ready' AND purpose = ${type} ${type === 'reel' ? sql`AND type = 'video'` : sql``}`,
			)
			return rows.length === ids.length
		},
		async creationWindow(authorId, since) {
			const result = await db.get<{ count: number; oldest: number | null }>(
				sql`SELECT COUNT(*) AS count, MIN(created_at) AS oldest FROM (SELECT created_at FROM posts WHERE author_id = ${authorId} AND created_at > ${since.getTime()} UNION ALL SELECT created_at FROM stories WHERE author_id = ${authorId} AND created_at > ${since.getTime()})`,
			)
			return { count: result?.count ?? 0, oldest: result?.oldest ? new Date(result.oldest) : null }
		},
		async create(id, authorId, input, now) {
			const placeholders = input.mediaIds.map(() => '?').join(',')
			const mediaGuard = input.mediaIds.length
				? `AND (SELECT COUNT(*) FROM media WHERE id IN (${placeholders}) AND owner_id = ? AND status = 'ready' AND purpose = ? ${input.type === 'reel' ? "AND type = 'video'" : ''}) = ?`
				: ''
			const since = now.getTime() - 3600000
			const parameters = [
				id,
				authorId,
				input.type,
				input.caption,
				now.getTime(),
				authorId,
				since,
				authorId,
				since,
				...(input.mediaIds.length
					? [...input.mediaIds, authorId, input.type, input.mediaIds.length]
					: []),
			]
			const statements = [
				d1
					.prepare(
						`INSERT INTO posts (id, author_id, type, caption, created_at) SELECT ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM (SELECT id FROM posts WHERE author_id = ? AND created_at > ? UNION ALL SELECT id FROM stories WHERE author_id = ? AND created_at > ?)) < 30 ${mediaGuard}`,
					)
					.bind(...parameters),
			]
			for (const [position, mediaId] of input.mediaIds.entries()) {
				statements.push(
					d1
						.prepare(
							'INSERT INTO post_media (post_id, media_id, position) SELECT id, ?, ? FROM posts WHERE id = ?',
						)
						.bind(mediaId, position, id),
				)
				statements.push(
					d1
						.prepare(
							"UPDATE media SET status = 'attached' WHERE id = ? AND EXISTS (SELECT 1 FROM post_media WHERE post_id = ? AND media_id = ?)",
						)
						.bind(mediaId, id, mediaId),
				)
			}
			const result = await d1.batch(statements)
			if (!result[0].meta.changes) {
				const window = await this.creationWindow(authorId, new Date(since))
				throw window.count >= 30
					? new AppError('RATE_LIMITED')
					: new AppError('VALIDATION_FAILED', { mediaIds: 'INVALID_FORMAT' })
			}
		},
		async update(id, caption, now) {
			await d1.batch([
				d1
					.prepare(
						'INSERT INTO post_edits (post_id, caption, replaced_at) SELECT id, caption, ? FROM posts WHERE id = ?',
					)
					.bind(now.getTime(), id),
				d1
					.prepare('UPDATE posts SET caption = ?, edited_at = ? WHERE id = ?')
					.bind(caption, now.getTime(), id),
			])
		},
		async delete(id, now) {
			await d1.prepare('UPDATE posts SET deleted_at = ? WHERE id = ?').bind(now.getTime(), id).run()
		},
		async react(id, viewerId, kind, active, now) {
			const table = kind === 'like' ? 'likes' : 'saves'
			const write = active
				? d1
						.prepare(
							`INSERT OR IGNORE INTO ${table} (post_id, user_id, created_at) VALUES (?, ?, ?)`,
						)
						.bind(id, viewerId, now.getTime())
				: d1.prepare(`DELETE FROM ${table} WHERE post_id = ? AND user_id = ?`).bind(id, viewerId)
			if (kind === 'save') {
				await write.run()
				return
			}
			await d1.batch([
				write,
				d1
					.prepare(
						'UPDATE posts SET like_count = (SELECT COUNT(*) FROM likes WHERE post_id = ?) WHERE id = ?',
					)
					.bind(id, id),
			])
		},
	}
}
