import { sql } from 'drizzle-orm'
import type { Db } from '../../db'
import type { NotificationFollowers } from '../application/ports'

export function createNotificationFollowers(db: Db): NotificationFollowers {
	return {
		async listIds(authorId, publishedAt) {
			const rows = await db.all<{ id: string }>(sql`
				SELECT f.follower_id AS id FROM follows f JOIN user u ON u.id = f.follower_id
				WHERE f.followee_id = ${authorId} AND f.created_at <= ${publishedAt.getTime()}
				AND u.banned = 0 AND u.username IS NOT NULL`)
			return rows.map((row) => row.id)
		},
	}
}
