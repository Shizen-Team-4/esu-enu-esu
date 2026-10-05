import { sql } from 'drizzle-orm'
import type { getDb } from '../../db'
import type { StoryAudienceRepository } from '../application/audience-ports'
import { encodeCursor } from '../../shared/domain/cursor'
export function createStoryAudience(db: ReturnType<typeof getDb>): StoryAudienceRepository {
	return {
		async list(id, authorId, now, { cursor, limit }) {
			const condition = sql`v.story_id = ${id} AND s.author_id = ${authorId} AND s.expires_at > ${now.getTime()} AND v.viewer_id != ${authorId} AND u.banned = 0`
			const count = await db.get<{ count: number }>(
				sql`SELECT COUNT(*) AS count FROM story_views v JOIN stories s ON s.id = v.story_id JOIN user u ON u.id = v.viewer_id WHERE ${condition}`,
			)
			const rows = await db.all<{
				id: string
				username: string
				name: string
				image: string | null
				seenAt: number
				liked: number
			}>(
				sql`SELECT u.id, u.username, u.name, u.image, v.seen_at AS seenAt,
   EXISTS(SELECT 1 FROM story_likes WHERE story_id = v.story_id AND user_id = v.viewer_id) AS liked
   FROM story_views v JOIN stories s ON s.id = v.story_id JOIN user u ON u.id = v.viewer_id
   WHERE ${condition} ${cursor ? sql`AND (v.seen_at < ${cursor.time} OR (v.seen_at = ${cursor.time} AND v.viewer_id < ${cursor.id}))` : sql``}
   ORDER BY v.seen_at DESC, v.viewer_id DESC LIMIT ${limit + 1}`,
			)
			const page = rows.slice(0, limit),
				last = page.at(-1)
			return {
				total: count?.count ?? 0,
				items: page.map((row) => ({
					user: { id: row.id, username: row.username, displayName: row.name, avatarUrl: row.image },
					viewedAt: new Date(row.seenAt).toISOString(),
					liked: Boolean(row.liked),
				})),
				nextCursor:
					rows.length > limit && last ? encodeCursor({ time: last.seenAt, id: last.id }) : null,
			}
		},
	}
}
