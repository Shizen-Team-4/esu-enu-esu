import { sql } from 'drizzle-orm'
import type { Page, UserSummary } from '$lib/contract'
import type { getDb } from '../../db'
import type { Cursor } from '../../shared/domain/cursor'
import { encodeCursor } from '../../shared/domain/cursor'
import { AppError } from '../../shared/domain/app-error'

type LikerRow = {
	id: string
	username: string | null
	name: string
	image: string | null
	createdAt: number
}

export function createPostSocialRepository(db: ReturnType<typeof getDb>, d1: D1Database) {
	return {
		async createRepost(id: string, authorId: string, originalId: string, now: Date) {
			const result = await d1
				.prepare(
					`INSERT INTO posts (id, author_id, type, caption, repost_of_id, created_at)
					SELECT ?, ?, 'post', '', p.id, ? FROM posts p JOIN user u ON u.id = p.author_id
					WHERE p.id = ? AND p.deleted_at IS NULL AND u.banned = 0`,
				)
				.bind(id, authorId, now.getTime(), originalId)
				.run()
			if (!result.meta.changes) throw new AppError('NOT_FOUND')
		},
		async listLikers(postId: string, cursor?: Cursor, limit = 20): Promise<Page<UserSummary>> {
			const rows =
				await db.all<LikerRow>(sql`SELECT u.id, u.username, u.name, u.image, l.created_at AS createdAt
				FROM likes l JOIN user u ON u.id = l.user_id AND u.banned = 0
				WHERE l.post_id = ${postId} ${cursor ? sql`AND (l.created_at < ${cursor.time} OR (l.created_at = ${cursor.time} AND u.id < ${cursor.id}))` : sql``}
				ORDER BY l.created_at DESC, u.id DESC LIMIT ${limit + 1}`)
			const page = rows.slice(0, limit)
			const last = page.at(-1)
			return {
				items: page.map((row) => ({
					id: row.id,
					username: row.username ?? '',
					displayName: row.name,
					avatarUrl: row.image,
				})),
				nextCursor:
					rows.length > limit && last ? encodeCursor({ time: last.createdAt, id: last.id }) : null,
			}
		},
	}
}
