import { sql } from 'drizzle-orm'
import type { getDb } from '../../db'
import { AppError } from '../../shared/domain/app-error'
import { encodeCursor } from '../../shared/domain/cursor'
import type { Story, StoryRepository } from '../application/ports'

type StoryRow = {
	id: string
	authorId: string
	username: string | null
	name: string
	image: string | null
	mediaId: string
	type: 'image' | 'video'
	key: string
	thumbnail: string | null
	width: number
	height: number
	duration: number | null
	createdAt: number
	expiresAt: number
	seen: number
	liked: number
	likes: number
}
const columns = (
	viewerId: string,
) => sql`s.id, s.author_id AS authorId, u.username, u.name, u.image, m.id AS mediaId, m.type, m.r2_key AS key, m.thumbnail_r2_key AS thumbnail, m.width, m.height, m.duration_sec AS duration, s.created_at AS createdAt, s.expires_at AS expiresAt,
EXISTS(SELECT 1 FROM story_views WHERE story_id = s.id AND viewer_id = ${viewerId}) AS seen,
EXISTS(SELECT 1 FROM story_likes WHERE story_id = s.id AND user_id = ${viewerId}) AS liked,
(SELECT COUNT(*) FROM story_likes WHERE story_id = s.id) AS likes`
const access = (viewerId: string, now: Date) =>
	sql`s.expires_at > ${now.getTime()} AND u.banned = 0 AND (s.author_id = ${viewerId} OR EXISTS(SELECT 1 FROM follows WHERE follower_id = ${viewerId} AND followee_id = s.author_id))`

export function createStoryRepository(
	db: ReturnType<typeof getDb>,
	d1: D1Database,
	mediaUrl: string,
): StoryRepository {
	const map = (row: StoryRow): Story => ({
		id: row.id,
		author: {
			id: row.authorId,
			username: row.username ?? '',
			displayName: row.name,
			avatarUrl: row.image,
		},
		media: {
			id: row.mediaId,
			type: row.type,
			url: `${mediaUrl}/${row.key}`,
			thumbnailUrl: row.thumbnail ? `${mediaUrl}/${row.thumbnail}` : null,
			width: row.width,
			height: row.height,
			durationSec: row.duration,
		},
		createdAt: new Date(row.createdAt).toISOString(),
		expiresAt: new Date(row.expiresAt).toISOString(),
		viewer: { seen: Boolean(row.seen), liked: Boolean(row.liked) },
		likes: row.likes,
	})
	return {
		async create(id, authorId, mediaId, now, expiresAt) {
			const since = now.getTime() - 3600000
			const result = await d1.batch([
				d1
					.prepare(
						"INSERT INTO stories (id, author_id, media_id, created_at, expires_at) SELECT ?, ?, id, ?, ? FROM media WHERE id = ? AND owner_id = ? AND purpose = 'story' AND status = 'ready' AND (SELECT COUNT(*) FROM (SELECT id FROM posts WHERE author_id = ? AND created_at > ? UNION ALL SELECT id FROM stories WHERE author_id = ? AND created_at > ?)) < 30",
					)
					.bind(
						id,
						authorId,
						now.getTime(),
						expiresAt.getTime(),
						mediaId,
						authorId,
						authorId,
						since,
						authorId,
						since,
					),
				d1
					.prepare(
						"UPDATE media SET status = 'attached' WHERE id = ? AND EXISTS(SELECT 1 FROM stories WHERE id = ? AND media_id = ?)",
					)
					.bind(mediaId, id, mediaId),
			])
			if (!result[0].meta.changes) {
				const count = await db.get<{ count: number }>(
					sql`SELECT COUNT(*) AS count FROM (SELECT id FROM posts WHERE author_id = ${authorId} AND created_at > ${since} UNION ALL SELECT id FROM stories WHERE author_id = ${authorId} AND created_at > ${since})`,
				)
				throw count && count.count >= 30
					? new AppError('RATE_LIMITED')
					: new AppError('VALIDATION_FAILED', { mediaId: 'INVALID_FORMAT' })
			}
		},
		async find(id, viewerId, now) {
			const row = await db.get<StoryRow>(
				sql`SELECT ${columns(viewerId)} FROM stories s JOIN user u ON u.id = s.author_id JOIN media m ON m.id = s.media_id WHERE s.id = ${id} AND ${access(viewerId, now)}`,
			)
			return row ? map(row) : null
		},
		async list(username, viewerId, now) {
			const user = await db.get<{ id: string }>(
				sql`SELECT id FROM user WHERE username = ${username} AND banned = 0 AND (id = ${viewerId} OR EXISTS(SELECT 1 FROM follows WHERE follower_id = ${viewerId} AND followee_id = user.id))`,
			)
			if (!user) return null
			return (
				await db.all<StoryRow>(
					sql`SELECT ${columns(viewerId)} FROM stories s JOIN user u ON u.id = s.author_id JOIN media m ON m.id = s.media_id WHERE s.author_id = ${user.id} AND ${access(viewerId, now)} ORDER BY s.created_at, s.id`,
				)
			).map(map)
		},
		async tray(viewerId, now, limit, cursor) {
			const group = cursor ? Number(cursor.id[0]) : 0,
				id = cursor?.id.slice(2) ?? ''
			const grouped = sql`SELECT u.id, u.username, u.name, u.image, COUNT(*) AS count, MAX(s.created_at) AS latestAt, MAX(NOT EXISTS(SELECT 1 FROM story_views WHERE story_id = s.id AND viewer_id = ${viewerId})) AS unseen, CASE WHEN u.id = ${viewerId} THEN 0 WHEN MAX(NOT EXISTS(SELECT 1 FROM story_views WHERE story_id = s.id AND viewer_id = ${viewerId})) THEN 1 ELSE 2 END AS rank FROM stories s JOIN user u ON u.id = s.author_id WHERE ${access(viewerId, now)} GROUP BY u.id`
			const rows = await db.all<{
				id: string
				username: string | null
				name: string
				image: string | null
				count: number
				latestAt: number
				unseen: number
				rank: number
			}>(
				sql`SELECT * FROM (${grouped}) ${cursor ? sql`WHERE rank > ${group} OR (rank = ${group} AND (latestAt < ${cursor.time} OR (latestAt = ${cursor.time} AND id < ${id})))` : sql``} ORDER BY rank, latestAt DESC, id DESC LIMIT ${limit + 1}`,
			)
			const page = rows.slice(0, limit),
				last = page.at(-1)
			return {
				items: page.map((row) => ({
					author: {
						id: row.id,
						username: row.username ?? '',
						displayName: row.name,
						avatarUrl: row.image,
					},
					hasUnseen: Boolean(row.unseen),
					storyCount: row.count,
					latestAt: new Date(row.latestAt).toISOString(),
				})),
				nextCursor:
					rows.length > limit && last
						? encodeCursor({ time: last.latestAt, id: `${last.rank}_${last.id}` })
						: null,
			}
		},
		async seen(id, viewerId, now) {
			await db.run(
				sql`INSERT OR IGNORE INTO story_views (story_id, viewer_id, seen_at) SELECT id, ${viewerId}, ${now.getTime()} FROM stories WHERE id = ${id} AND expires_at > ${now.getTime()}`,
			)
		},
		async like(id, viewerId, active, now) {
			if (active)
				await db.run(
					sql`INSERT OR IGNORE INTO story_likes (story_id, user_id, created_at) SELECT id, ${viewerId}, ${now.getTime()} FROM stories WHERE id = ${id} AND expires_at > ${now.getTime()}`,
				)
			else
				await db.run(sql`DELETE FROM story_likes WHERE story_id = ${id} AND user_id = ${viewerId}`)
			return (
				(
					await db.get<{ count: number }>(
						sql`SELECT COUNT(*) AS count FROM story_likes WHERE story_id = ${id}`,
					)
				)?.count ?? 0
			)
		},
		async delete(id) {
			await d1.batch([
				d1
					.prepare(
						"UPDATE media SET status = 'ready', created_at = ? WHERE id = (SELECT media_id FROM stories WHERE id = ?)",
					)
					.bind(Date.now(), id),
				d1.prepare('DELETE FROM stories WHERE id = ?').bind(id),
			])
		},
	}
}
